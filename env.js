// ============================================================================
// env.js — GOM TOÀN BỘ BIẾN MÔI TRƯỜNG VỀ MỘT CHỖ
// ----------------------------------------------------------------------------
// Đọc từ process.env, có giá trị mặc định cho môi trường dev để chạy được ngay
// mà không cần tạo file .env. Xem `.env.example` để biết các biến cần khai báo
// khi chạy production.
// ============================================================================

module.exports = {
  PORT: process.env.PORT || 5060,

  // Để trống -> dùng file SQLite local (data/leads.db). Có giá trị -> dùng
  // Turso (SQLite trên cloud), phục vụ deploy serverless.
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || '',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',
  DB_FILE: process.env.DB_FILE || '',

  // Tài khoản admin demo dùng để gọi thử GET /api/leads.
  // ĐỔI NGAY khi chạy thật — đây chỉ là giá trị mặc định cho môi trường demo.
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@zimacademy.vn',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',
};
