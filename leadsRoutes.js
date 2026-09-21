// ============================================================================
// leadsRoutes.js — KHAI BÁO ROUTE CỦA BE2
// ============================================================================
const express = require('express');
const controller = require('./leadsController');
const { adminAuthMiddleware } = require('./adminAuth');
const asyncHandler = require('./asyncHandler');

const router = express.Router();

// Tạo/cập nhật lead: CÔNG KHAI — khách ẩn danh ở đầu phễu chưa đăng nhập vẫn
// phải gọi được, nếu bắt đăng nhập ở đây sẽ mất sạch lead đầu phễu.
router.post('/', asyncHandler(controller.upsertLead));

// Xem danh sách lead: CHỈ ADMIN — dữ liệu chứa tên, số điện thoại, email thật
// của khách hàng, không được để lộ công khai.
router.get('/', asyncHandler(adminAuthMiddleware), asyncHandler(controller.listLeads));

module.exports = router;
