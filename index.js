// ============================================================================
// index.js — ĐIỂM KHỞI CHẠY SERVICE
// ============================================================================
const app = require('./app');
const db = require('./db');
const { PORT } = require('./env');

// Chờ schema tạo xong rồi mới mở cổng, để request đầu tiên không rơi vào lúc
// bảng chưa tồn tại.
db.ready()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`BE2 (Leads & CRM) dang chay tai http://localhost:${PORT}`);
      console.log(`  POST http://localhost:${PORT}/api/leads`);
      console.log(`  GET  http://localhost:${PORT}/api/leads?status=da_lam_micro_test  (can token Admin)`);
    });
  })
  .catch((err) => {
    console.error('Khong khoi tao duoc database:', err);
    process.exit(1);
  });
