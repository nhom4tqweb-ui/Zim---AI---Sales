const crypto = require('crypto');

/**
 * Sinh mã đơn hàng dạng: ZIM + YYMMDD + 6 ký tự alphanumeric (chữ hoa + số).
 * Ví dụ: ZIM24091712F8A9
 *
 * Thiết kế để:
 *  - Ngắn gọn, dễ gõ / dễ khớp khi khách hàng chuyển khoản thủ công.
 *  - Không dùng ký tự dễ nhầm (0/O, 1/I) để giảm sai sót khi đối soát bằng regex.
 *  - Có timestamp giúp sort tự nhiên theo thời gian tạo.
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ 0,O,1,I

function randomSegment(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
  }
  return out;
}

function generateOrderCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
  return `ZIM${datePart}${randomSegment(6)}`;
}

// Regex dùng để tìm order code bên trong nội dung chuyển khoản ngân hàng.
// Nội dung CK thường bị ngân hàng thêm khoảng trắng / viết hoa toàn bộ, nên
// khi parse cần strip khoảng trắng và uppercase trước khi match.
const ORDER_CODE_REGEX = /ZIM\d{6}[A-Z0-9]{6}/;

function extractOrderCodeFromContent(content) {
  if (!content) return null;
  const normalized = content.toUpperCase().replace(/\s+/g, '');
  const match = normalized.match(ORDER_CODE_REGEX);
  return match ? match[0] : null;
}

module.exports = { generateOrderCode, extractOrderCodeFromContent, ORDER_CODE_REGEX };
