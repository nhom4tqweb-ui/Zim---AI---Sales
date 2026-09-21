// ============================================================================
// Lead.js — SCHEMA PHỄU BÁN HÀNG (BE2)
// ----------------------------------------------------------------------------
// Định nghĩa duy nhất về "một Lead trông như thế nào": danh sách trường, kiểu
// dữ liệu, enum phân loại, và câu lệnh tạo bảng. Mọi nơi khác (controller,
// service, db) đều import từ đây để không có 2 định nghĩa lệch nhau.
//
// LƯU Ý VỀ MONGODB: đề bài gốc yêu cầu "Schema MongoDB". Dự án chạy thật bằng
// SQLite/libSQL thay vì MongoDB — lý do và bản Mongoose tương đương được ghi
// đầy đủ trong `db-schema.md`. Cấu trúc trường, enum và thuật toán gắn nhãn
// giữ nguyên 100% so với thiết kế Mongoose, nên có thể đổi tầng lưu trữ mà
// không phải sửa logic nghiệp vụ.
// ============================================================================

// 3 trạng thái phân loại tự động (enum) — đúng theo yêu cầu đề bài.
const LEAD_CLASSIFICATION = {
  DA_DIEN_FORM: 'da_dien_form',
  DA_LAM_MICRO_TEST: 'da_lam_micro_test',
  DA_DE_LAI_THONG_TIN_THANH_TOAN: 'da_de_lai_thong_tin_thanh_toan',
};

// Thứ hạng của từng trạng thái trong phễu. Dùng để so sánh khi cập nhật:
// phân loại CHỈ ĐƯỢC TIẾN LÊN, không bao giờ bị tụt hạng (xem leadsService.js).
const LEAD_CLASSIFICATION_RANK = {
  [LEAD_CLASSIFICATION.DA_DIEN_FORM]: 1,
  [LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST]: 2,
  [LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN]: 3,
};

// Nhãn tiếng Việt hiển thị trên màn hình Admin.
const LEAD_CLASSIFICATION_LABEL = {
  [LEAD_CLASSIFICATION.DA_DIEN_FORM]: 'Đã điền khảo sát',
  [LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST]: 'Đã làm Micro Test',
  [LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN]: 'Đã chạm màn thanh toán',
};

// Câu lệnh tạo bảng. `session_id` là UNIQUE vì đây là khóa định danh khách
// ẩn danh ở đầu phễu (khách chưa đăng nhập, chưa để lại số điện thoại).
const LEAD_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    email TEXT,
    goal TEXT,
    reason TEXT,
    daily_time TEXT,
    deadline TEXT,
    target_band TEXT,
    micro_test_bands TEXT,
    classification TEXT NOT NULL DEFAULT 'da_dien_form',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_classification ON leads(classification);
`;

// Kiểm tra dữ liệu đầu vào trước khi ghi DB. Trả về mảng lỗi rỗng nếu hợp lệ.
// Cố ý nới lỏng: đầu phễu khách mới chỉ chọn mục tiêu, chưa có tên/SĐT/email —
// bắt buộc quá sớm sẽ làm mất lead (xem edge-cases.md).
function validateLeadPayload(payload = {}) {
  const errors = [];

  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    errors.push('Thiếu sessionId để định danh lead trong phiên duyệt web.');
  }
  if (payload.phone && !/^[0-9+().\s-]{8,20}$/.test(String(payload.phone))) {
    errors.push('Số điện thoại không đúng định dạng.');
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.push('Email không đúng định dạng.');
  }
  if (payload.microTestBands !== undefined && payload.microTestBands !== null) {
    if (typeof payload.microTestBands !== 'object' || Array.isArray(payload.microTestBands)) {
      errors.push('microTestBands phải là object dạng { Listening: 6, Reading: 5, ... }.');
    } else {
      const saiKieu = Object.entries(payload.microTestBands).filter(([, v]) => typeof v !== 'number' || v < 0 || v > 9);
      if (saiKieu.length) errors.push('Điểm từng kỹ năng trong microTestBands phải là số trong khoảng 0-9.');
    }
  }

  return errors;
}

// libSQL/SQLite không nhận `undefined` làm tham số bind — ép về `null` tường minh.
const nullNeuUndefined = (v) => (v === undefined ? null : v);

module.exports = {
  LEAD_CLASSIFICATION,
  LEAD_CLASSIFICATION_RANK,
  LEAD_CLASSIFICATION_LABEL,
  LEAD_TABLE_SQL,
  validateLeadPayload,
  nullNeuUndefined,
};
