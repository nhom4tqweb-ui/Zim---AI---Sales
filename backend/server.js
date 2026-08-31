/**
 * server.js
 * -----------------------------------------------------------
 * Điểm khởi chạy chính của Backend (Node.js/Express).
 * Chịu trách nhiệm:
 *  - Cấu hình middleware (CORS, JSON body parser)
 *  - Mount các route API (/api/orders)
 *  - Lắng nghe cổng chạy server
 * -----------------------------------------------------------
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors()); // Cho phép Frontend (khác domain/port) gọi API
app.use(express.json()); // Parse JSON body từ request

// ---- Routes ----
app.use("/api/orders", ordersRouter);

// Route kiểm tra server còn sống (health check)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ZIM Sales Funnel API đang chạy." });
});

// ---- Xử lý lỗi 404 ----
app.use((req, res) => {
  res.status(404).json({ error: "Không tìm thấy endpoint." });
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
