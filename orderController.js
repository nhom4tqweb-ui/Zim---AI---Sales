const mongoose = require('mongoose');
const Order = require('../models/Order');
const { createOrder, buildQrPayloadForOrder } = require('../services/orderService');

/**
 * POST /api/v1/orders/create
 * body: { student_id, course_id, amount }
 */
async function create(req, res, next) {
  try {
    const { student_id, course_id, amount } = req.body;

    if (!student_id || !course_id || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu student_id, course_id hoặc amount' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount phải là số dương' });
    }
    if (!mongoose.isValidObjectId(student_id) || !mongoose.isValidObjectId(course_id)) {
      return res.status(400).json({ success: false, message: 'student_id hoặc course_id không hợp lệ' });
    }

    const order = await createOrder({ studentId: student_id, courseId: course_id, amount });

    return res.status(201).json({ success: true, data: buildQrPayloadForOrder(order) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/orders/:orderCode
 * Dùng để Frontend polling trạng thái đơn hàng (fallback nếu chưa dùng WebSocket).
 */
async function getByCode(req, res, next) {
  try {
    const order = await Order.findOne({ orderCode: req.params.orderCode });
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    return res.json({ success: true, data: buildQrPayloadForOrder(order) });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getByCode };
