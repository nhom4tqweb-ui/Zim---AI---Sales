const cron = require('node-cron');
const axios = require('axios');
const env = require('../config/env');
const { expireStaleOrders } = require('../services/orderService');
const { processIncomingTransaction } = require('../services/paymentService');

/**
 * Gọi API "danh sách giao dịch" của cổng ngân hàng (SePay: GET /transactions/list,
 * cần Bearer token) để lấy các giao dịch gần đây, dùng làm nguồn backup khi
 * webhook bị lỡ (server down lúc đó, mạng lỗi, v.v...).
 *
 * Trả về mảng đã chuẩn hóa theo cùng format với payload webhook.
 */
async function fetchRecentBankTransactions({ sinceMinutes = 30 } = {}) {
  if (!env.bankGateway.baseUrl || !env.bankGateway.apiToken) {
    console.warn('[Cronjob] Chưa cấu hình BANK_GATEWAY_BASE_URL / API token, bỏ qua bước gọi API');
    return [];
  }

  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

  const { data } = await axios.get(`${env.bankGateway.baseUrl}/transactions/list`, {
    headers: { Authorization: `Bearer ${env.bankGateway.apiToken}` },
    params: {
      transaction_date_min: since.toISOString().slice(0, 19).replace('T', ' '),
    },
    timeout: 10_000,
  });

  const rawList = data?.transactions ?? data?.data ?? [];

  return rawList.map((t) => ({
    source: 'CRONJOB',
    transactionId: String(t.id ?? t.reference_number ?? t.referenceCode),
    gateway: t.bank_brand_name ?? t.gateway,
    content: t.transaction_content ?? t.content,
    amount: Number(t.amount_in ?? t.transferAmount ?? t.amount ?? 0),
    transferType: 'in', // API list thường chỉ trả giao dịch tiền vào theo filter, hoặc lọc riêng nếu cần
  }));
}

/**
 * Job chính: chạy định kỳ để
 *   1) Đánh dấu EXPIRED cho các đơn PENDING quá hạn QR.
 *   2) Quét giao dịch ngân hàng gần đây, đối soát bù cho các webhook bị lỡ.
 */
async function runReconciliationSweep() {
  try {
    const expiredCount = await expireStaleOrders();
    if (expiredCount > 0) console.log(`[Cronjob] Đã đánh dấu EXPIRED cho ${expiredCount} đơn hàng`);

    const transactions = await fetchRecentBankTransactions({ sinceMinutes: 30 });
    for (const txn of transactions) {
      const result = await processIncomingTransaction(txn);
      if (result.status !== 'ALREADY_PROCESSED') {
        console.log('[Cronjob] Đối soát backup:', result);
      }
    }
  } catch (err) {
    console.error('[Cronjob] Lỗi khi chạy reconciliation sweep:', err.message);
  }
}

/** Chạy mỗi 5 phút. */
function scheduleReconciliationJob() {
  cron.schedule('*/5 * * * *', runReconciliationSweep);
  console.log('[Cronjob] Đã lên lịch reconciliationJob (mỗi 5 phút)');
}

module.exports = { scheduleReconciliationJob, runReconciliationSweep };
