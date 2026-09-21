// ============================================================================
// db.js — KẾT NỐI DATABASE + KHỞI TẠO SCHEMA
// ----------------------------------------------------------------------------
// Dùng libSQL (@libsql/client) — cùng một đoạn code chạy được cả 2 môi trường:
//   - Local dev : url = "file:./data/leads.db" (giống SQLite thường, không cần
//                 cài đặt gì, không cần tài khoản dịch vụ nào)
//   - Production: url = TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (SQLite trên cloud)
// Chỉ đổi biến môi trường, KHÔNG đổi một dòng SQL nào.
//
// Vì sao không dùng MongoDB như đề bài gốc: xem phần "Quyết định kỹ thuật"
// trong README.md và db-schema.md (có kèm bản Mongoose tương đương).
// ============================================================================

const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, DB_FILE } = require('./env');
const { LEAD_TABLE_SQL } = require('./Lead');

const duongDanFile = DB_FILE || path.join(__dirname, 'data', 'leads.db');
const dungCloud = !!TURSO_DATABASE_URL;

if (!dungCloud) {
  fs.mkdirSync(path.dirname(duongDanFile), { recursive: true });
}

const client = createClient({
  url: TURSO_DATABASE_URL || `file:${duongDanFile}`,
  authToken: TURSO_AUTH_TOKEN,
});

// Lớp tiện ích mỏng giữ API quen thuộc (get/all/run/exec). Lưu ý PHẢI await —
// libSQL luôn bất đồng bộ, kể cả khi chạy bằng file local.
async function get(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows[0];
}

async function all(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows;
}

async function run(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return { lastInsertRowid: Number(rs.lastInsertRowid), changes: rs.rowsAffected };
}

async function exec(sql) {
  await client.executeMultiple(sql);
}

// Bảng `leads` là của BE2. 3 bảng còn lại thuộc quyền sở hữu của role khác
// (orders = BE3, users/assessment_results = luồng học viên) — ở đây CHỈ ĐỌC để
// làm giàu dữ liệu cho màn hình CRM, không ghi vào. Tạo sẵn để service này chạy
// độc lập được ngay cả khi tách khỏi hệ thống lớn.
const SCHEMA_PHU_TRO_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    package_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    paid_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assessment_results (
    user_id INTEGER PRIMARY KEY,
    goal TEXT,
    target_band TEXT,
    bands TEXT,
    estimated_band REAL,
    dominant_error_type TEXT,
    error_label TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`;

async function khoiTaoSchema() {
  await exec(LEAD_TABLE_SQL);
  await exec(SCHEMA_PHU_TRO_SQL);

  // Tài khoản Admin demo để gọi thử GET /api/leads (endpoint này yêu cầu quyền admin).
  const soAdmin = (await get('SELECT COUNT(*) AS c FROM admins')).c;
  if (soAdmin === 0) {
    const bcrypt = require('bcryptjs');
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./env');
    await run('INSERT INTO admins (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)', [
      'Quản trị viên ZIM',
      ADMIN_EMAIL,
      bcrypt.hashSync(ADMIN_PASSWORD, 10),
      'admin',
      new Date().toISOString(),
    ]);
  }
}

// Trên môi trường serverless, mỗi lần "cold start" có thể chạy lại module này.
// Cache Promise để schema chỉ được khởi tạo đúng 1 lần mỗi tiến trình.
let readyPromise = null;
function ready() {
  if (!readyPromise) readyPromise = khoiTaoSchema();
  return readyPromise;
}

module.exports = { get, all, run, exec, ready, client };
