// ============================================================================
// adminAuth.js — XÁC THỰC ADMIN CHO ENDPOINT GET /api/leads
// ----------------------------------------------------------------------------
// GET /api/leads trả về tên, số điện thoại, email thật của khách hàng nên bắt
// buộc phải có quyền admin. Trong hệ thống lớn, tầng xác thực này nằm ở bảng
// `admins` + `admin_sessions` RIÊNG, tách hoàn toàn khỏi tài khoản học viên
// (khác bảng, khác endpoint, khác token) — token của học viên không dùng được
// cho bất kỳ endpoint admin nào và ngược lại.
//
// GIỚI HẠN (bản demo): token là UUID ngẫu nhiên lưu DB, không phải JWT có hạn
// dùng, không tự hết hạn. Production cần thay bằng JWT + refresh token.
// ============================================================================

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập Admin hoặc phiên đã hết hạn.' });
  }

  const phien = await db.get('SELECT admin_id FROM admin_sessions WHERE token = ?', [token]);
  if (!phien) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập Admin hoặc phiên đã hết hạn.' });
  }

  const admin = await db.get('SELECT * FROM admins WHERE id = ?', [phien.admin_id]);
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Tài khoản Admin không còn tồn tại.' });
  }

  req.admin = admin;
  req.adminToken = token;
  next();
}

// POST /api/admin/auth/login — để chấm bài/test có thể lấy token gọi GET /api/leads.
async function adminLogin(req, res) {
  const { email, password } = req.body || {};
  const admin = await db.get('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)', [String(email || '')]);

  if (!admin || !bcrypt.compareSync(String(password || ''), admin.password_hash)) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu Admin không đúng.' });
  }

  const token = crypto.randomUUID();
  await db.run('INSERT INTO admin_sessions (token, admin_id, created_at) VALUES (?, ?, ?)', [
    token,
    admin.id,
    new Date().toISOString(),
  ]);

  res.json({
    success: true,
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}

module.exports = { adminAuthMiddleware, adminLogin };
