/**
 * config/db.js
 * -----------------------------------------------------------
 * Khởi tạo connection pool tới MySQL bằng thư viện mysql2/promise.
 * Dùng pool thay vì 1 connection đơn để xử lý được nhiều request
 * đồng thời (nhiều học viên chốt đơn cùng lúc) mà không bị nghẽn.
 * -----------------------------------------------------------
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zim_sales_funnel",
  waitForConnections: true,
  connectionLimit: 10, // Số connection tối đa trong pool
  queueLimit: 0,
});

module.exports = pool;
