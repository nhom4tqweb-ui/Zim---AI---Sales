/**
 * routes/orders.js
 * -----------------------------------------------------------
 * Khai báo các endpoint liên quan tới đơn hàng / đăng ký khóa học.
 * -----------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderStatus,
  confirmPayment,
} = require("../controllers/orderController");

// Tạo đơn hàng mới (Học viên submit form trong Modal Step 5)
router.post("/", createOrder);

// Kiểm tra trạng thái thanh toán (Frontend polling mỗi vài giây)
router.get("/:code/status", getOrderStatus);

// (Demo) Xác nhận thanh toán thủ công / giả lập Webhook ngân hàng
router.patch("/:code/confirm", confirmPayment);

module.exports = router;
