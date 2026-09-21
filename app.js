// ============================================================================
// app.js — LẮP RÁP EXPRESS APP
// ----------------------------------------------------------------------------
// Tách khỏi index.js để có thể import app vào test tự động mà không cần mở cổng
// thật (cũng là cách deploy lên serverless: export app, không gọi listen).
// ============================================================================

const express = require('express');
const cors = require('cors');

const db = require('./db');
const leadsRoutes = require('./leadsRoutes');
const { adminLogin } = require('./adminAuth');
const asyncHandler = require('./asyncHandler');
const errorHandler = require('./errorHandler');
const notFound = require('./notFound');

const app = express();

// CORS mở cho mọi origin để demo chạy được từ file:// hoặc bất kỳ static server
// nào. Production cần siết lại theo đúng domain thật.
app.use(cors());
app.use(express.json());

// Đảm bảo schema đã tạo xong trước khi xử lý bất kỳ request nào. db.ready()
// cache Promise nên chỉ thực sự chờ ở lần gọi đầu tiên.
app.use((req, res, next) => {
  db.ready().then(() => next(), next);
});

app.get('/api/health', (req, res) =>
  res.json({ success: true, service: 'be2-leads-crm', time: new Date().toISOString() })
);

// Đăng nhập Admin — cần để lấy token gọi GET /api/leads.
app.post('/api/admin/auth/login', asyncHandler(adminLogin));

// Hai endpoint chính của BE2 theo đề bài.
app.use('/api/leads', leadsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
