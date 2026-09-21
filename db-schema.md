# Schema — Phễu bán hàng (BE2)

## 1. Bảng `leads`

Bảng chính của BE2. Mỗi dòng là một khách hàng tiềm năng trong phễu.

| Cột | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | INTEGER PK | ✔ | Khóa chính tự tăng |
| `session_id` | TEXT UNIQUE | ✔ | Định danh phiên duyệt web, do client sinh và lưu `sessionStorage`. Là khóa duy nhất ở **đầu phễu** khi khách còn ẩn danh |
| `name` | TEXT | | Họ tên |
| `phone` | TEXT (index) | | Số điện thoại — **danh tính thật**, ưu tiên dùng để gộp lead |
| `email` | TEXT | | Email; cũng là cầu nối sang `users` để lấy kết quả chẩn đoán |
| `goal` | TEXT | | Mục tiêu: `IELTS` / `TOEIC` / `COMMUNICATION` |
| `reason` | TEXT | | Lý do học (du học, thăng chức, tốt nghiệp...) |
| `daily_time` | TEXT | | Thời gian tự học mỗi ngày |
| `deadline` | TEXT | | Thời hạn cần có kết quả |
| `target_band` | TEXT | | Band mục tiêu |
| `micro_test_bands` | TEXT (JSON) | | Điểm 4 kỹ năng, lưu dạng JSON: `{"Listening":6,"Reading":5,"Writing":5.5,"Speaking":5}` |
| `classification` | TEXT (enum) | ✔ | Nhãn phân loại phễu, mặc định `da_dien_form` |
| `created_at` | TEXT (ISO) | ✔ | Thời điểm tạo |
| `updated_at` | TEXT (ISO) | ✔ | Thời điểm cập nhật gần nhất — dùng tính `isUrgent` |

**Index:** `phone` (tra lead khi gộp theo số điện thoại), `classification` (lọc theo giai đoạn phễu).

### Enum `classification`

| Giá trị | Thứ hạng | Ý nghĩa |
|---|---|---|
| `da_dien_form` | 1 | Đã điền khảo sát mục tiêu |
| `da_lam_micro_test` | 2 | Đã có điểm Micro Test |
| `da_de_lai_thong_tin_thanh_toan` | 3 | Đã mở màn hình thanh toán |

Thứ hạng dùng để đảm bảo nhãn **chỉ tiến, không lùi** (xem `README.md` mục 4).

### Vì sao không có cột "Ngân sách"

Đề bài gốc liệt kê trường *Ngân sách*. Khảo sát thực tế của frontend **không hỏi ngân sách** — thay bằng 2 câu hỏi hữu ích hơn cho việc tư vấn lộ trình: `daily_time` (thời gian tự học/ngày) và `deadline` (thời hạn cần kết quả). Schema bám theo đúng dữ liệu thật đang thu thập, không tạo cột luôn rỗng.

---

## 2. Các bảng chỉ đọc (thuộc role khác)

BE2 **không ghi** vào các bảng này, chỉ `JOIN` để làm giàu dữ liệu cho màn hình CRM.

### `orders` (BE3 sở hữu)
Nối theo `phone`. Lấy `amount` (giá trị đơn) và `status` (`pending` / `paid`).

### `users` + `assessment_results` (luồng học viên sở hữu)
Nối theo `leads.email` → `users.email` → `assessment_results.user_id`.
Lấy `estimated_band` (band chẩn đoán đã lưu) và `error_label` (lỗ hổng học thuật trọng tâm).

### `admins` + `admin_sessions`
Phục vụ xác thực cho `GET /api/leads`. Tách hoàn toàn khỏi bảng `users` của học viên — khác bảng, khác endpoint, khác token; token của học viên không dùng được cho endpoint admin và ngược lại.

---

## 3. Bản Mongoose tương đương

Đề bài yêu cầu "Schema MongoDB". Bản chạy thật dùng SQLite/libSQL (lý do ở `README.md` mục 7), nhưng cấu trúc trường và enum giữ nguyên. Nếu cần chuyển sang MongoDB, đây là schema tương đương — **toàn bộ logic trong `leadsService.js` giữ nguyên, không phải sửa dòng nào**:

```js
// Lead.js (bản Mongoose)
const mongoose = require('mongoose');

const LEAD_CLASSIFICATION = {
  DA_DIEN_FORM: 'da_dien_form',
  DA_LAM_MICRO_TEST: 'da_lam_micro_test',
  DA_DE_LAI_THONG_TIN_THANH_TOAN: 'da_de_lai_thong_tin_thanh_toan',
};

const leadSchema = new mongoose.Schema(
  {
    sessionId:  { type: String, required: true, unique: true, index: true },

    // Thông tin cá nhân
    name:  { type: String, trim: true },
    phone: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },

    // Mục tiêu học
    goal:       { type: String, enum: ['IELTS', 'TOEIC', 'COMMUNICATION'] },
    reason:     { type: String },
    dailyTime:  { type: String },
    deadline:   { type: String },
    targetBand: { type: String },

    // Điểm Micro Test 4 kỹ năng
    microTestBands: {
      Listening: Number,
      Reading:   Number,
      Writing:   Number,
      Speaking:  Number,
    },

    // Nhãn phân loại phễu — CHỈ TIẾN, KHÔNG LÙI (xem leadsService.suyRaPhanLoai)
    leadClassification: {
      type: String,
      enum: Object.values(LEAD_CLASSIFICATION),
      default: LEAD_CLASSIFICATION.DA_DIEN_FORM,
      index: true,
    },
  },
  { timestamps: true } // tự sinh createdAt / updatedAt
);

module.exports = mongoose.model('Lead', leadSchema);
```

**Điểm khác duy nhất khi đổi tầng lưu trữ:**

| Việc | SQLite/libSQL (bản đang chạy) | MongoDB/Mongoose |
|---|---|---|
| Tra lead cũ | `SELECT * FROM leads WHERE phone = ?` | `Lead.findOne({ phone })` |
| Tạo/cập nhật | `INSERT` / `UPDATE ... WHERE id = ?` | `lead.save()` |
| Điểm 4 kỹ năng | Lưu chuỗi JSON, `JSON.parse` khi đọc | Lưu object lồng, đọc trực tiếp |
| Mốc thời gian | Tự gán `created_at` / `updated_at` | `{ timestamps: true }` tự lo |
