const Order = require('../models/Order');
const env = require('../config/env');
const { generateOrderCode } = require('../utils/orderCode');
const { buildVietQrQuickLink } = require('../utils/vietqr');

/**
 * Tạo đơn hàng mới. Retry sinh lại orderCode nếu (cực hiếm) bị trùng unique index.
 */
async function createOrder({ studentId, courseId, amount }) {
  const expiresAt = new Date(Date.now() + env.order.expireMinutes * 60 * 1000);

  const MAX_RETRY = 3;
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const orderCode = generateOrderCode();
    try {
      const order = await Order.create({
        orderCode,
        studentId,
        courseId,
        amount,
        expiresAt,
      });
      return order;
    } catch (err) {
      if (err.code === 11000 && err.keyValue && err.keyValue.orderCode) {
        lastErr = err;
        continue; // trùng mã, thử lại với mã mới
      }
      throw err;
    }
  }
  throw lastErr;
}

function buildQrPayloadForOrder(order) {
  const quickLinkVietQR = buildVietQrQuickLink({
    amount: order.amount,
    addInfo: order.orderCode,
  });

  return {
    orderId: order._id,
    orderCode: order.orderCode,
    amount: order.amount,
    bankAccount: env.bank.accountNo,
    bankAccountName: env.bank.accountName,
    bankBin: env.bank.bankId,
    quickLinkVietQR,
    expiresAt: order.expiresAt,
    status: order.status,
  };
}

/**
 * Đánh dấu EXPIRED cho các order PENDING đã quá hạn.
 * Gọi định kỳ bởi cronjob (jobs/reconciliationJob.js) trước khi đối soát,
 * để tránh cấp quyền cho những đơn đã hết hạn QR.
 */
async function expireStaleOrders() {
  const result = await Order.updateMany(
    { status: 'PENDING', expiresAt: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
  return result.modifiedCount || 0;
}

module.exports = { createOrder, buildQrPayloadForOrder, expireStaleOrders };
