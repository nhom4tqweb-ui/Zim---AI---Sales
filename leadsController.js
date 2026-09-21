// ============================================================================
// leadsController.js — TẦNG HTTP CỦA BE2
// ----------------------------------------------------------------------------
// Chỉ làm 3 việc: đọc request -> gọi leadsService/db -> trả response.
// Mọi quy tắc nghiệp vụ (gắn nhãn, kịch bản follow-up) nằm ở leadsService.js.
// ============================================================================

const db = require('./db');
const { validateLeadPayload, nullNeuUndefined: n } = require('./Lead');
const { suyRaPhanLoai, formatLead } = require('./leadsService');

// ----------------------------------------------------------------------------
// POST /api/leads — công khai (khách chưa đăng nhập vẫn gọi được)
// ----------------------------------------------------------------------------
// Frontend gọi endpoint này ở 3 mốc trong phễu:
//   1. Xong khảo sát mục tiêu     -> da_dien_form
//   2. Xong Micro Test            -> da_lam_micro_test
//   3. Mở màn hình thanh toán     -> da_de_lai_thong_tin_thanh_toan
//
// CÁCH TRA LEAD CŨ (quan trọng để không tạo bản ghi trùng):
//   - Ưu tiên tra theo `phone` nếu payload đã có — số điện thoại là danh tính
//     thật, ổn định qua nhiều thiết bị/phiên duyệt web khác nhau.
//   - Chưa có phone (đầu phễu khách còn ẩn danh) thì tra theo `sessionId` do
//     client sinh và lưu trong sessionStorage.
async function upsertLead(req, res) {
  const payload = req.body || {};

  const loi = validateLeadPayload(payload);
  if (loi.length) {
    return res.status(400).json({ success: false, message: loi.join(' ') });
  }

  const { sessionId, name, phone, email, goal, reason, dailyTime, deadline, targetBand, microTestBands, reachedCheckout } = payload;
  const now = new Date().toISOString();

  const leadCu =
    (phone && (await db.get('SELECT * FROM leads WHERE phone = ?', [phone]))) ||
    (await db.get('SELECT * FROM leads WHERE session_id = ?', [sessionId]));

  const classification = suyRaPhanLoai({ microTestBands, reachedCheckout }, leadCu && leadCu.classification);
  const bandsJson = microTestBands ? JSON.stringify(microTestBands) : leadCu ? leadCu.micro_test_bands : null;

  let leadId;
  if (leadCu) {
    // Cập nhật theo `id` (khóa chính) chứ KHÔNG theo session_id: lead có thể vừa
    // được tìm thấy qua `phone` với session_id khác hẳn — dùng session_id ở đây
    // sẽ không khớp dòng nào và câu UPDATE âm thầm không làm gì cả.
    await db.run(
      `UPDATE leads SET name = ?, phone = ?, email = ?, goal = ?, reason = ?, daily_time = ?, deadline = ?,
       target_band = ?, micro_test_bands = ?, classification = ?, updated_at = ? WHERE id = ?`,
      [
        n(name ?? leadCu.name),
        n(phone ?? leadCu.phone),
        n(email ?? leadCu.email),
        n(goal ?? leadCu.goal),
        n(reason ?? leadCu.reason),
        n(dailyTime ?? leadCu.daily_time),
        n(deadline ?? leadCu.deadline),
        n(targetBand ?? leadCu.target_band),
        n(bandsJson),
        classification,
        now,
        leadCu.id,
      ]
    );
    leadId = leadCu.id;
  } else {
    const info = await db.run(
      `INSERT INTO leads (session_id, name, phone, email, goal, reason, daily_time, deadline, target_band, micro_test_bands, classification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, n(name), n(phone), n(email), n(goal), n(reason), n(dailyTime), n(deadline), n(targetBand), n(bandsJson), classification, now, now]
    );
    leadId = info.lastInsertRowid;
  }

  const lead = await db.get('SELECT * FROM leads WHERE id = ?', [leadId]);
  res.status(leadCu ? 200 : 201).json({ success: true, lead: formatLead(lead) });
}

// ----------------------------------------------------------------------------
// GET /api/leads?status=... — CHỈ ADMIN (chứa thông tin liên hệ của khách)
// ----------------------------------------------------------------------------
// Nạp kèm dữ liệu 2 bảng khác để màn hình CRM có đủ thông tin trong 1 lần gọi:
//   - orders: giá trị đơn hàng khách đã tạo, khớp theo số điện thoại.
//   - assessment_results: kết quả chẩn đoán thật (band + lỗ hổng trọng tâm),
//     nối qua leads.email -> users.email -> assessment_results.user_id.
//
// Lấy THEO LÔ (2 truy vấn) rồi ghép trong bộ nhớ, thay vì truy vấn trong vòng
// lặp — tránh N+1 query khi danh sách lead dài.
async function listLeads(req, res) {
  const { status } = req.query;

  const rows = status
    ? await db.all('SELECT * FROM leads WHERE classification = ? ORDER BY updated_at DESC', [status])
    : await db.all('SELECT * FROM leads ORDER BY updated_at DESC');

  const donHangTheoSdt = new Map();
  for (const o of await db.all('SELECT phone, amount, status, created_at FROM orders ORDER BY created_at ASC')) {
    donHangTheoSdt.set(o.phone, o); // bản ghi sau ghi đè bản ghi trước => giữ đơn mới nhất
  }

  const chanDoanTheoEmail = new Map();
  const rowsChanDoan = await db.all(
    `SELECT u.email AS email, a.estimated_band, a.error_label
     FROM assessment_results a JOIN users u ON u.id = a.user_id`
  );
  for (const r of rowsChanDoan) {
    if (r.email) chanDoanTheoEmail.set(String(r.email).toLowerCase(), r);
  }

  const leads = rows.map((row) =>
    formatLead(row, {
      donHang: row.phone ? donHangTheoSdt.get(row.phone) : null,
      chanDoan: row.email ? chanDoanTheoEmail.get(String(row.email).toLowerCase()) : null,
    })
  );

  res.json({ success: true, leads });
}

module.exports = { upsertLead, listLeads };
