// ============================================================================
// leadsService.js — TOÀN BỘ LOGIC NGHIỆP VỤ CỦA BE2
// ----------------------------------------------------------------------------
// Tách riêng khỏi controller (controller chỉ lo HTTP: đọc request, trả response)
// để logic phân loại và kịch bản follow-up có thể test độc lập, không cần dựng
// server. Gồm 3 phần theo đúng 3 đầu việc của đề bài:
//   1. Thuật toán gắn nhãn tự động (tagging)
//   2. Kịch bản chăm sóc theo cấp độ rớt (follow-up scripts)
//   3. Làm giàu dữ liệu cho Sales (band chẩn đoán, đơn hàng, mức ưu tiên)
// ============================================================================

const { LEAD_CLASSIFICATION, LEAD_CLASSIFICATION_RANK } = require('./Lead');

// ----------------------------------------------------------------------------
// 1. THUẬT TOÁN GẮN NHÃN TỰ ĐỘNG
// ----------------------------------------------------------------------------
// Suy ra trạng thái phễu từ payload client gửi lên:
//   - Chỉ có câu trả lời khảo sát              -> da_dien_form
//   - Có thêm điểm Micro Test                  -> da_lam_micro_test
//   - Mở màn hình thanh toán (reachedCheckout) -> da_de_lai_thong_tin_thanh_toan
//
// QUY TẮC QUAN TRỌNG: phân loại CHỈ TIẾN, KHÔNG LÙI. So sánh bằng RANK rồi lấy
// giá trị cao hơn giữa trạng thái suy ra và trạng thái đã lưu.
//
// Vì sao phải làm vậy: client gọi API này nhiều lần ở nhiều bước khác nhau của
// phễu, và không phải lần nào payload cũng kèm đủ dữ liệu. Nếu gán thẳng trạng
// thái tính lại từ đầu mỗi lần (cách làm trực giác), thì một khách ĐÃ chạm màn
// thanh toán mà sau đó quay lại sửa khảo sát sẽ bị tụt về `da_dien_form` —
// đội Sales mất dấu đúng nhóm khách nóng nhất. Xem thêm `edge-cases.md`.
function suyRaPhanLoai(payload, phanLoaiHienTai) {
  let target = LEAD_CLASSIFICATION.DA_DIEN_FORM;
  if (payload.microTestBands) target = LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST;
  if (payload.reachedCheckout) target = LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN;

  if (!phanLoaiHienTai) return target;
  return LEAD_CLASSIFICATION_RANK[target] > LEAD_CLASSIFICATION_RANK[phanLoaiHienTai]
    ? target
    : phanLoaiHienTai;
}

// ----------------------------------------------------------------------------
// 2. KỊCH BẢN CHĂM SÓC THEO CẤP ĐỘ RỚT (FOLLOW-UP SCRIPTS)
// ----------------------------------------------------------------------------
// Trả về đúng 1 kịch bản tương ứng với bước khách dừng lại, để Sales đọc ngay
// trên màn hình Admin mà không phải tự suy nghĩ lời thoại.
function goiYKichBanFollowUp(lead) {
  const mucTieu = lead.target_band ? `band ${lead.target_band}` : 'mục tiêu IELTS';

  switch (lead.classification) {
    case LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN:
      return 'Khách đã rất ưng khóa học (đã mở màn thanh toán) nhưng chưa chuyển khoản — gọi điện ngay trong 2 giờ để hỗ trợ vấn đề học phí hoặc khuyến mãi ngân hàng, tránh khách nguội đi.';

    case LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST:
      return `Khách đã có kết quả chẩn đoán (${mucTieu}) nhưng chưa xem báo giá — gọi điện giải thích lộ trình phù hợp với band hiện tại và nhắc ưu đãi giữ chỗ có thời hạn để thúc đẩy sang bước thanh toán.`;

    case LEAD_CLASSIFICATION.DA_DIEN_FORM:
    default:
      return 'Khách mới để lại mục tiêu học, chưa làm Micro Test — nhắn tin/gọi mời hoàn thành bài test 6 câu (chỉ mất 15-20 phút) để nhận lộ trình cá nhân hóa, tránh khách nguội trước khi có dữ liệu chẩn đoán.';
  }
}

// Phân tích "điểm dừng chân": khách đang kẹt ở đâu trong phễu. Dùng chung nguồn
// suy luận với kịch bản trên, để màn hình CRM không phải tự bịa nội dung.
function phanTichDiemDungChan(lead) {
  switch (lead.classification) {
    case LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN:
      return 'Đã mở màn thanh toán (quét mã VietQR) nhưng hệ thống chưa ghi nhận giao dịch thành công.';
    case LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST:
      return 'Đã hoàn thành Micro Test và xem lộ trình, nhưng chưa chuyển sang bước xem báo giá.';
    case LEAD_CLASSIFICATION.DA_DIEN_FORM:
    default:
      return 'Mới điền xong khảo sát mục tiêu, chưa bắt đầu làm bài Micro Test chẩn đoán.';
  }
}

// Ưu đãi chốt sale đề xuất theo từng cấp độ rớt.
function goiYUuDaiChotSale(lead) {
  switch (lead.classification) {
    case LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN:
      return 'Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng, hoặc giảm trực tiếp học phí nếu hoàn tất thanh toán trong hôm nay.';
    case LEAD_CLASSIFICATION.DA_LAM_MICRO_TEST:
      return 'Tặng 1 buổi chữa bài Writing/Speaking 1-1 với giáo viên band 8.0+ khi giữ chỗ lớp khai giảng gần nhất.';
    case LEAD_CLASSIFICATION.DA_DIEN_FORM:
    default:
      return 'Tặng bộ tài liệu từ vựng cốt lõi + suất làm Micro Test có AI chấm Speaking/Writing miễn phí.';
  }
}

// ----------------------------------------------------------------------------
// 3. LÀM GIÀU DỮ LIỆU CHO ĐỘI SALES
// ----------------------------------------------------------------------------
// Band trung bình 4 kỹ năng từ kết quả Micro Test. Tính Ở SERVER để mọi màn hình
// (Kanban, bảng dữ liệu, drawer chi tiết) đều đọc cùng một con số.
function tinhBandTrungBinh(bands) {
  if (!bands) return null;
  const diem = Object.values(bands).filter((v) => typeof v === 'number');
  if (!diem.length) return null;
  return Math.round((diem.reduce((a, b) => a + b, 0) / diem.length) * 10) / 10;
}

const MOT_PHUT = 60 * 1000;

// Chuyển 1 dòng DB thô thành object trả cho client, kèm toàn bộ trường suy ra.
// `phuTro` chứa dữ liệu join từ bảng khác (đơn hàng, kết quả chẩn đoán) — xem
// leadsController.listLeads để biết cách nạp theo lô, tránh N+1 query.
function formatLead(row, phuTro = {}) {
  const microTestBands = row.micro_test_bands ? JSON.parse(row.micro_test_bands) : null;
  const chanDoan = phuTro.chanDoan || null;
  const donHang = phuTro.donHang || null;
  const phutTuLanCapNhat = (Date.now() - new Date(row.updated_at).getTime()) / MOT_PHUT;

  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    goal: row.goal,
    reason: row.reason,
    dailyTime: row.daily_time,
    deadline: row.deadline,
    targetBand: row.target_band,
    microTestBands,
    classification: row.classification,

    // Kịch bản chăm sóc — đầu việc số 3 của đề bài
    followUpScript: goiYKichBanFollowUp(row),
    dropOffReason: phanTichDiemDungChan(row),
    salesOffer: goiYUuDaiChotSale(row),

    // Dữ liệu làm giàu: ưu tiên kết quả chẩn đoán đã lưu theo tài khoản, không
    // có thì tính từ chính điểm Micro Test của lead.
    estimatedBand: (chanDoan && chanDoan.estimated_band) || tinhBandTrungBinh(microTestBands),
    dominantError: chanDoan ? chanDoan.error_label : null,
    amount: donHang ? donHang.amount : null,
    orderStatus: donHang ? donHang.status : null,

    // "Khẩn cấp" = đang kẹt ở bước thanh toán (gần chốt nhất), HOẶC vừa hoạt
    // động trong 30 phút qua (khách còn đang online, gọi ngay dễ chốt nhất).
    isUrgent:
      row.classification === LEAD_CLASSIFICATION.DA_DE_LAI_THONG_TIN_THANH_TOAN ||
      phutTuLanCapNhat <= 30,
    minutesSinceUpdate: Math.max(0, Math.round(phutTuLanCapNhat)),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  suyRaPhanLoai,
  goiYKichBanFollowUp,
  phanTichDiemDungChan,
  goiYUuDaiChotSale,
  tinhBandTrungBinh,
  formatLead,
};
