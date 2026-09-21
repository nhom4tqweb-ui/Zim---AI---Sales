const Order = require('../models/Order');
const Enrollment = require('../models/Enrollment');
const env = require('../config/env');
const { extractOrderCodeFromContent } = require('../utils/orderCode');

/**
 * Cấp quyền học: tạo Enrollment nếu chưa có (idempotent qua unique index
 * {studentId, courseId}). Không dùng mongoose session/transaction bắt buộc
 * vì nhiều môi trường MongoDB học tập chạy standalone (không phải replica set,
 * transaction sẽ lỗi). Idempotent-upsert vẫn an toàn khi webhook bị gọi lại.
 *
 * Nếu deploy trên replica set / Atlas, có thể bọc 2 thao tác (update Order +
 * upsert Enrollment) trong 1 session để atomic tuyệt đối — xem comment cuối file.
 */
async function grantCourseAccess(order) {
  await Enrollment.updateOne(
    { studentId: order.studentId, courseId: order.courseId },
    {
      $setOnInsert: { grantedAt: new Date() },
      $set: { status: 'ACTIVE', orderId: order._id, revokedAt: null },
    },
    { upsert: true }
  );
}

function withinTolerance(received, expected) {
  const diff = Math.abs(received - expected);
  return diff <= env.order.amountTolerance;
}

/**
 * Xử lý 1 giao dịch ngân hàng (từ webhook thời gian thực HOẶC cronjob backup).
 *
 * @param {Object} txn
 * @param {'WEBHOOK'|'CRONJOB'} txn.source
 * @param {string} txn.transactionId  - id giao dịch duy nhất phía ngân hàng/cổng (vd SePay `id`/`referenceCode`)
 * @param {string} txn.gateway        - tên ngân hàng, vd "Vietcombank"
 * @param {string} txn.content        - nội dung chuyển khoản
 * @param {number} txn.amount         - số tiền giao dịch
 * @param {'in'|'out'} txn.transferType
 *
 * @returns {Promise<{ status: string, orderCode?: string, message: string }>}
 */
async function processIncomingTransaction(txn) {
  const { source, transactionId, gateway, content, amount, transferType } = txn;

  // 1. Chỉ xử lý giao dịch TIỀN VÀO. Bỏ qua giao dịch ra (vd hoàn tiền thủ công).
  if (transferType && transferType !== 'in' && transferType !== 'credit') {
    return { status: 'IGNORED_NOT_CREDIT', message: 'Không phải giao dịch tiền vào, bỏ qua' };
  }

  // 2. Idempotency: nếu transactionId này đã từng được ghi nhận trên bất kỳ order nào,
  //    trả về ngay - đây chính là cơ chế chặn xử lý trùng khi webhook bị gọi lại (retry).
  if (transactionId) {
    const already = await Order.findOne({ bankTransactionId: transactionId }).lean();
    if (already) {
      return {
        status: 'ALREADY_PROCESSED',
        orderCode: already.orderCode,
        message: 'Giao dịch đã được xử lý trước đó (idempotent)',
      };
    }
  }

  // 3. Tìm order code trong nội dung chuyển khoản.
  const orderCode = extractOrderCodeFromContent(content);
  if (!orderCode) {
    // Không tìm thấy mã đơn -> không tự động đối soát được, cần con người xử lý thủ công.
    console.warn(`[Payment] Không tìm thấy orderCode trong nội dung: "${content}"`);
    return { status: 'UNMATCHED_NO_ORDER_CODE', message: 'Không tìm thấy mã đơn hàng trong nội dung CK' };
  }

  const order = await Order.findOne({ orderCode });
  if (!order) {
    console.warn(`[Payment] orderCode "${orderCode}" không khớp đơn hàng nào trong DB`);
    return { status: 'UNMATCHED_ORDER_NOT_FOUND', orderCode, message: 'Mã đơn hàng không tồn tại' };
  }

  // 4a. Đơn đã PAID rồi -> khách chuyển trùng / chuyển 2 lần cho cùng 1 đơn.
  if (order.status === 'PAID') {
    order.reconciliationLogs.push({
      source, transactionId, amount,
      note: 'Nhận thêm giao dịch cho đơn ĐÃ THANH TOÁN -> có thể khách chuyển trùng, cần hoàn tiền thủ công',
    });
    await order.save();
    return {
      status: 'DUPLICATE_PAYMENT_ALREADY_PAID',
      orderCode,
      message: 'Đơn đã được thanh toán trước đó, giao dịch này cần được hoàn tiền thủ công',
    };
  }

  // 4b. Đơn đã bị HỦY hoặc HẾT HẠN -> khách chuyển khoản cho đơn không còn hiệu lực.
  if (order.status === 'EXPIRED' || order.status === 'CANCELED') {
    order.reconciliationLogs.push({
      source, transactionId, amount,
      note: `Nhận giao dịch cho đơn đã ${order.status}, không tự cấp quyền, cần đội vận hành xử lý (hoàn tiền hoặc tạo đơn mới)`,
    });
    await order.save();
    return {
      status: 'PAYMENT_FOR_INACTIVE_ORDER',
      orderCode,
      message: `Đơn hàng đang ở trạng thái ${order.status}, cần xử lý thủ công`,
    };
  }

  // 5. Đơn đang PENDING (hoặc UNDERPAID) -> đối soát số tiền.
  const totalReceived = (order.amountReceived || 0) + amount;

  if (totalReceived < order.amount && !withinTolerance(totalReceived, order.amount)) {
    // Chuyển thiếu tiền: cộng dồn, giữ trạng thái chờ phần còn lại.
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status }, // guard chống race condition
      {
        $set: { status: 'UNDERPAID', amountReceived: totalReceived, matchedGateway: gateway, matchedContent: content },
        $push: { reconciliationLogs: { source, transactionId, amount, note: `Chuyển thiếu, đã nhận ${totalReceived}/${order.amount}` } },
      },
      { new: true }
    );
    if (!updated) {
      // Có race condition (order đã bị cập nhật bởi request khác) -> để cronjob backup xử lý lại.
      return { status: 'RACE_CONDITION_RETRY_LATER', orderCode, message: 'Đơn đang được xử lý đồng thời, sẽ thử lại' };
    }
    return { status: 'UNDERPAID', orderCode, message: `Đã ghi nhận thanh toán thiếu: ${totalReceived}/${order.amount}` };
  }

  // Đủ tiền hoặc thừa tiền (trong hoặc ngoài tolerance) -> coi như THANH TOÁN THÀNH CÔNG.
  // Update có điều kiện status hiện tại để tránh 2 request cùng lúc cùng set PAID (Race Condition).
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    {
      $set: {
        status: 'PAID',
        amountReceived: totalReceived,
        bankTransactionId: transactionId,
        matchedGateway: gateway,
        matchedContent: content,
        paidAt: new Date(),
      },
      $push: {
        reconciliationLogs: {
          source, transactionId, amount,
          note: totalReceived > order.amount ? `Chuyển thừa ${totalReceived - order.amount}, cần hoàn tiền phần dư` : 'Khớp số tiền, thanh toán thành công',
        },
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    // Đơn vừa bị 1 request khác (webhook trùng, hoặc cronjob chạy song song) cập nhật trước.
    // -> Không throw lỗi, chỉ báo để caller (route) vẫn trả 200 cho bên gọi webhook.
    return { status: 'RACE_CONDITION_RESOLVED_BY_OTHER_REQUEST', orderCode, message: 'Đơn đã được request khác xử lý xong' };
  }

  // 6. Cấp quyền học sau khi chắc chắn order này vừa được set PAID bởi chính request hiện tại.
  await grantCourseAccess(updatedOrder);

  return {
    status: totalReceived > order.amount ? 'PAID_OVERPAID' : 'PAID',
    orderCode,
    message: 'Thanh toán thành công, đã cấp quyền truy cập khóa học',
  };
}

module.exports = { processIncomingTransaction, grantCourseAccess };

/*
 * GHI CHÚ - Nâng cấp lên Mongo Transaction (nếu chạy Replica Set / Atlas):
 *
 * const session = await mongoose.startSession();
 * await session.withTransaction(async () => {
 *   const updatedOrder = await Order.findOneAndUpdate(filter, update, { new: true, session });
 *   if (updatedOrder) await grantCourseAccess(updatedOrder, session);
 * });
 * session.endSession();
 *
 * Cách này đảm bảo nếu grantCourseAccess lỗi giữa chừng, việc update Order cũng
 * được rollback. Với thiết kế hiện tại (idempotent upsert Enrollment), nếu
 * grantCourseAccess lỗi, cronjob đối soát backup hoặc 1 lần gọi lại thủ công
 * endpoint vẫn có thể tự sửa vì Order đã ở trạng thái PAID nhưng Enrollment
 * chưa có -> nên cân nhắc thêm 1 cronjob "self-heal" quét các Order PAID mà
 * chưa có Enrollment tương ứng.
 */
