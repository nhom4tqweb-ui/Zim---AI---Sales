const { processIncomingTransaction } = require('../services/paymentService');

/**
 * POST /api/v1/payments/webhook
 *
 * Payload tham khảo chuẩn SePay IPN (áp dụng tương tự cho Casso vì cấu trúc gần giống):
 * {
 *   "id": 92704,
 *   "gateway": "Vietcombank",
 *   "transactionDate": "2024-07-02 11:08:33",
 *   "accountNumber": "1017588888",
 *   "code": null,
 *   "content": "NGUYEN VAN A CK ZIM240917A1B2C3",
 *   "transferType": "in",
 *   "transferAmount": 990000,
 *   "accumulated": 105010000,
 *   "referenceCode": "FT24012345678"
 * }
 *
 * QUAN TRỌNG VỀ RESPONSE:
 *  - Cổng thanh toán chỉ retry khi lỗi mạng / timeout, KHÔNG dựa vào body response.
 *    Do đó dù giao dịch không khớp được đơn hàng nào, ta vẫn trả 200 nhanh nhất
 *    có thể để tránh cổng nghĩ server lỗi và spam retry không cần thiết.
 *  - Middleware verifyWebhookSignature đã chặn request giả mạo TRƯỚC route này,
 *    nên trong handler chỉ còn lo logic nghiệp vụ.
 */
async function handleWebhook(req, res, next) {
  try {
    const body = req.body || {};

    // Chuẩn hóa field name (SePay dùng transferAmount/transferType/id,
    // một số cổng khác có thể đặt tên khác — map lại 1 chỗ duy nhất ở đây).
    const txn = {
      source: 'WEBHOOK',
      transactionId: String(body.id ?? body.transaction_id ?? body.referenceCode ?? ''),
      gateway: body.gateway,
      content: body.content ?? body.description ?? '',
      amount: Number(body.transferAmount ?? body.amount ?? 0),
      transferType: body.transferType ?? body.transfer_type,
    };

    if (!txn.transactionId) {
      // Không có transactionId thì không thể đảm bảo idempotency -> từ chối sớm.
      return res.status(400).json({ success: false, message: 'Thiếu transaction id' });
    }

    const result = await processIncomingTransaction(txn);
    console.log('[Webhook] Kết quả xử lý:', result);

    // Luôn trả 200 khi request đã được xác thực & xử lý (kể cả không match được đơn),
    // đúng theo yêu cầu response format của SePay: { "success": true }
    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleWebhook };
