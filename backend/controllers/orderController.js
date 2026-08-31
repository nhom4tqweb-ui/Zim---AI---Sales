/**
 * controllers/orderController.js
 * -----------------------------------------------------------
 * Xử lý nghiệp vụ cho Step 5 - Modal chốt khóa học:
 *  1. createOrder   -> Tạo đơn hàng mới, sinh mã VietQR
 *  2. getOrderStatus -> Kiểm tra trạng thái thanh toán (dùng cho polling)
 *  3. confirmPayment (demo) -> Giả lập Webhook xác nhận đã thanh toán
 * -----------------------------------------------------------
 */

const pool = require("../config/db");

// ====== THÔNG TIN TÀI KHOẢN NGÂN HÀNG CỦA TRUNG TÂM (demo) ======
// BIN ngân hàng theo chuẩn Napas - VietQR (vd: Vietcombank = 970436)
// Danh sách đầy đủ: https://api.vietqr.io/v2/banks
const BANK_BIN = process.env.BANK_BIN || "970436"; // Vietcombank (demo)
const BANK_ACCOUNT_NO = process.env.BANK_ACCOUNT_NO || "0123456789";
const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || "TRUNG TAM ANH NGU ZIM";
const VIETQR_TEMPLATE = "compact2"; // Kiểu giao diện QR: compact2 | compact | qr_only | print

/**
 * Sinh mã đăng ký duy nhất, dạng: DK + YYMMDD + 4 số random
 * Ví dụ: DK2608310892
 */
function generateOrderCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000); // 4 số random
  return `DK${yy}${mm}${dd}${rand}`;
}

/**
 * Xây dựng nội dung chuyển khoản theo cú pháp chuẩn:
 * [MãĐăngKý] - [SĐT] - [TênHọcViên]
 */
function buildTransferContent(orderCode, phone, name) {
  // Bỏ dấu tiếng Việt để tránh lỗi hiển thị trên một số app ngân hàng
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  return `${orderCode} - ${phone} - ${normalizedName}`;
}

/**
 * Sinh URL ảnh VietQR động dựa trên API công khai của VietQR.io
 * Cấu trúc: https://img.vietqr.io/image/{BANK_BIN}-{SO_TK}-{TEMPLATE}.png
 *           ?amount={SO_TIEN}&addInfo={NOI_DUNG}&accountName={TEN_TK}
 */
function buildVietQRUrl({ amount, addInfo, accountName }) {
  const baseUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT_NO}-${VIETQR_TEMPLATE}.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * POST /api/orders
 * Tạo đơn hàng mới khi học viên submit form trong Modal Step 5.
 */
async function createOrder(req, res) {
  try {
    const {
      courseId,
      courseName,
      originalPrice,
      finalPrice,
      studentName,
      studentPhone,
      studentEmail,
    } = req.body;

    // ---- Validate dữ liệu đầu vào cơ bản ----
    if (!courseId || !courseName || !studentName || !studentPhone) {
      return res.status(400).json({
        error: "Thiếu thông tin bắt buộc (courseId, courseName, studentName, studentPhone).",
      });
    }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(studentPhone)) {
      return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
    }
    if (!finalPrice || finalPrice <= 0) {
      return res.status(400).json({ error: "Giá tiền không hợp lệ." });
    }

    // ---- Tính toán % giảm giá (để lưu lịch sử/báo cáo) ----
    const discountPercent = originalPrice
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0;

    const orderCode = generateOrderCode();
    const transferContent = buildTransferContent(orderCode, studentPhone, studentName);

    const qrUrl = buildVietQRUrl({
      amount: finalPrice,
      addInfo: transferContent,
      accountName: BANK_ACCOUNT_NAME,
    });

    // Thời hạn giữ ưu đãi: 10 phút kể từ lúc tạo đơn (đồng bộ với countdown FE)
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);

    // ---- Lưu đơn hàng vào MySQL ----
    const sql = `
      INSERT INTO enrollments
        (order_code, course_id, course_name, student_name, student_phone, student_email,
         original_price, discount_percent, final_price, transfer_content, qr_url,
         payment_status, expired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;
    await pool.execute(sql, [
      orderCode,
      courseId,
      courseName,
      studentName,
      studentPhone,
      studentEmail || null,
      originalPrice || finalPrice,
      discountPercent,
      finalPrice,
      transferContent,
      qrUrl,
      expiredAt,
    ]);

    // ---- Trả dữ liệu về cho Frontend để render khung QR ----
    return res.status(201).json({
      orderCode,
      qrUrl,
      finalPrice,
      transferContent,
      expiredAt,
    });
  } catch (error) {
    console.error("Lỗi tạo đơn hàng:", error);
    return res.status(500).json({ error: "Lỗi hệ thống, vui lòng thử lại sau." });
  }
}

/**
 * GET /api/orders/:code/status
 * Frontend gọi định kỳ (polling) để kiểm tra học viên đã
 * chuyển khoản thành công hay chưa.
 */
async function getOrderStatus(req, res) {
  try {
    const { code } = req.params;
    const [rows] = await pool.execute(
      "SELECT order_code, payment_status, final_price FROM enrollments WHERE order_code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    return res.json({
      orderCode: rows[0].order_code,
      paymentStatus: rows[0].payment_status, // 'pending' | 'paid' | 'expired'
      finalPrice: rows[0].final_price,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái đơn hàng:", error);
    return res.status(500).json({ error: "Lỗi hệ thống." });
  }
}

/**
 * PATCH /api/orders/:code/confirm
 * (DEMO) Mô phỏng Webhook từ cổng thanh toán/ngân hàng báo về khi
 * có giao dịch chuyển khoản khớp nội dung. Trong dự án thực tế,
 * endpoint này sẽ được gọi tự động bởi bên thứ 3 (VD: SePay, Casso,
 * hoặc Ngân hàng qua Webhook) chứ không gọi thủ công từ Frontend.
 */
async function confirmPayment(req, res) {
  try {
    const { code } = req.params;
    const [result] = await pool.execute(
      "UPDATE enrollments SET payment_status = 'paid', paid_at = NOW() WHERE order_code = ?",
      [code]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    return res.json({ message: "Xác nhận thanh toán thành công.", orderCode: code });
  } catch (error) {
    console.error("Lỗi xác nhận thanh toán:", error);
    return res.status(500).json({ error: "Lỗi hệ thống." });
  }
}

module.exports = { createOrder, getOrderStatus, confirmPayment };
