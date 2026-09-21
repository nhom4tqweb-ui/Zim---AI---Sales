# BE2 — Quản lý Leads & CRM Phân loại

Service backend phụ trách **phễu bán hàng** của ZIM Academy: lưu thông tin khách hàng tiềm năng, tự động gắn nhãn theo bước khách đang đứng trong phễu, và sinh kịch bản gọi lại cho đội Sales dựa trên cấp độ "rớt" của khách.

## 1. Ba đầu việc theo đề bài

| # | Yêu cầu | File thực hiện |
|---|---|---|
| 1 | Schema lưu thông tin phễu bán hàng (thông tin cá nhân, mục tiêu) | `Lead.js` |
| 2 | Thuật toán phân loại tự động gắn nhãn (3 trạng thái enum) | `leadsService.js` → `suyRaPhanLoai()` |
| 3 | Logic sinh kịch bản follow-up riêng theo cấp độ rớt | `leadsService.js` → `goiYKichBanFollowUp()` |
| + | Khai báo routes `POST /api/leads` và `GET /api/leads?status=...` | `leadsRoutes.js` |

## 2. Cách chạy

```bash
npm install
npm start
```

Mặc định chạy tại `http://localhost:5060`, dữ liệu lưu vào file `data/leads.db` (tự tạo ở lần chạy đầu tiên, **không cần cài đặt database riêng**).

Muốn đổi cấu hình: copy `.env.example` thành `.env` rồi sửa giá trị.

Chạy bộ test tự động (không cần mở server, không cần công cụ ngoài):

```bash
npm test
```

## 3. API

### `POST /api/leads` — công khai

Frontend gọi ở **3 mốc** trong phễu. Không bắt đăng nhập, vì đầu phễu khách còn hoàn toàn ẩn danh.

```bash
# Mốc 1 — xong khảo sát mục tiêu
curl -X POST http://localhost:5060/api/leads \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"lead-abc-123","name":"Nguyễn Văn An","phone":"0981234567",
       "goal":"IELTS","targetBand":"6.5","reason":"Du học Úc",
       "dailyTime":"1-2h/ngày","deadline":"3 tháng"}'
# => classification: "da_dien_form"

# Mốc 2 — xong Micro Test (gửi thêm điểm 4 kỹ năng)
curl -X POST http://localhost:5060/api/leads \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"lead-abc-123",
       "microTestBands":{"Listening":6,"Reading":5,"Writing":5.5,"Speaking":5}}'
# => classification: "da_lam_micro_test"

# Mốc 3 — khách mở màn hình thanh toán
curl -X POST http://localhost:5060/api/leads \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"lead-abc-123","reachedCheckout":true}'
# => classification: "da_de_lai_thong_tin_thanh_toan"
```

### `GET /api/leads?status=...` — chỉ Admin

Trả về tên/số điện thoại/email thật của khách nên **bắt buộc có token Admin**.

```bash
# Lấy token
TOKEN=$(curl -s -X POST http://localhost:5060/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zimacademy.vn","password":"Admin@123"}' | jq -r .token)

# Toàn bộ lead
curl http://localhost:5060/api/leads -H "Authorization: Bearer $TOKEN"

# Lọc theo giai đoạn phễu
curl "http://localhost:5060/api/leads?status=da_de_lai_thong_tin_thanh_toan" \
  -H "Authorization: Bearer $TOKEN"
```

### Ví dụ một lead trả về

```json
{
  "id": 1,
  "sessionId": "lead-abc-123",
  "name": "Nguyễn Văn An",
  "phone": "0981234567",
  "email": null,
  "goal": "IELTS",
  "reason": "Du học Úc",
  "dailyTime": "1-2h/ngày",
  "deadline": "3 tháng",
  "targetBand": "6.5",
  "microTestBands": { "Listening": 6, "Reading": 5, "Writing": 5.5, "Speaking": 5 },
  "classification": "da_lam_micro_test",

  "followUpScript": "Khách đã có kết quả chẩn đoán (band 6.5) nhưng chưa xem báo giá — gọi điện giải thích lộ trình phù hợp với band hiện tại và nhắc ưu đãi giữ chỗ có thời hạn để thúc đẩy sang bước thanh toán.",
  "dropOffReason": "Đã hoàn thành Micro Test và xem lộ trình, nhưng chưa chuyển sang bước xem báo giá.",
  "salesOffer": "Tặng 1 buổi chữa bài Writing/Speaking 1-1 với giáo viên band 8.0+ khi giữ chỗ lớp khai giảng gần nhất.",

  "estimatedBand": 5.4,
  "dominantError": null,
  "amount": null,
  "orderStatus": null,
  "isUrgent": true,
  "minutesSinceUpdate": 3,

  "createdAt": "2026-09-21T15:00:00.000Z",
  "updatedAt": "2026-09-21T15:03:00.000Z"
}
```

## 4. Thuật toán phân loại tự động

```
payload có gì?                          →  nhãn suy ra
─────────────────────────────────────────────────────────────
chỉ câu trả lời khảo sát                →  da_dien_form
+ microTestBands (điểm 4 kỹ năng)       →  da_lam_micro_test
+ reachedCheckout: true                 →  da_de_lai_thong_tin_thanh_toan
```

**Quy tắc bắt buộc: nhãn CHỈ TIẾN, KHÔNG LÙI.**

Mỗi trạng thái có một thứ hạng (`RANK` 1→3). Khi cập nhật, hệ thống so sánh nhãn suy ra từ payload mới với nhãn đã lưu và **giữ lại nhãn cao hơn**.

Vì sao phải làm vậy: client gọi API này nhiều lần ở nhiều bước, và không phải lần nào payload cũng kèm đủ dữ liệu. Nếu cứ tính lại nhãn từ đầu mỗi lần rồi gán đè (cách làm trực giác), một khách **đã chạm màn thanh toán** mà sau đó quay lại sửa khảo sát sẽ bị tụt về `da_dien_form` — đội Sales mất dấu đúng nhóm khách nóng nhất. Đây là lỗi thầm lặng, không báo lỗi gì cả, nên được xử lý ngay từ thiết kế.

## 5. Kịch bản follow-up theo cấp độ rớt

| Nhãn | Khách đang kẹt ở đâu | Kịch bản cho Sales |
|---|---|---|
| `da_de_lai_thong_tin_thanh_toan` | Đã mở màn thanh toán nhưng chưa chuyển khoản | Gọi **trong 2 giờ**, hỗ trợ vấn đề học phí / khuyến mãi ngân hàng |
| `da_lam_micro_test` | Có kết quả chẩn đoán, chưa xem báo giá | Gọi giải thích lộ trình theo band hiện tại + nhắc ưu đãi giữ chỗ |
| `da_dien_form` | Mới điền khảo sát, chưa làm test | Mời hoàn thành Micro Test 6 câu (15-20 phút) để có dữ liệu chẩn đoán |

Mỗi lead trả về 3 trường phục vụ Sales: `followUpScript` (lời thoại), `dropOffReason` (khách kẹt ở đâu), `salesOffer` (ưu đãi đề xuất).

## 6. Dữ liệu làm giàu cho đội Sales

`GET /api/leads` nối thêm dữ liệu từ 2 bảng khác để màn hình CRM có đủ thông tin trong **một lần gọi**:

| Trường | Nguồn |
|---|---|
| `estimatedBand` | Ưu tiên `assessment_results` (kết quả đã lưu theo tài khoản); không có thì tính trung bình từ `micro_test_bands` |
| `dominantError` | `leads.email` → `users.email` → `assessment_results.error_label` |
| `amount`, `orderStatus` | Bảng `orders` (BE3), khớp theo số điện thoại |
| `isUrgent` | Đang kẹt thanh toán **hoặc** vừa hoạt động trong 30 phút qua |
| `minutesSinceUpdate` | Khoảng cách tới lần cập nhật gần nhất (frontend đổi thành "8 phút trước") |

Các trường này được tính **ở server**, không để client tự suy diễn — nhờ vậy mọi màn hình (Kanban, bảng dữ liệu, drawer chi tiết) luôn hiển thị cùng một con số.

Hai truy vấn nạp theo lô rồi ghép trong bộ nhớ, **không truy vấn trong vòng lặp** — tránh N+1 query khi danh sách lead dài.

## 7. Quyết định kỹ thuật: vì sao không dùng MongoDB

Đề bài gốc ghi "Schema MongoDB". Bản chạy thật dùng **SQLite/libSQL**, lý do:

1. **Không cần cài đặt gì** — chấm bài chỉ cần `npm install && npm start`, không phải dựng MongoDB server hay tạo tài khoản Atlas.
2. **Deploy được lên serverless** — dự án chạy trên Vercel, libSQL cho phép dùng chung một đoạn code cho cả file local lẫn database cloud (Turso), chỉ đổi biến môi trường.
3. **Dữ liệu phễu có quan hệ rõ ràng** — lead ↔ đơn hàng ↔ kết quả chẩn đoán đều nối bằng khóa, hợp với mô hình quan hệ hơn.

**Quan trọng:** cấu trúc trường, enum phân loại và toàn bộ thuật toán giữ **nguyên 100%** so với thiết kế Mongoose. `db-schema.md` có kèm bản Mongoose tương đương — đổi tầng lưu trữ không phải sửa một dòng logic nghiệp vụ nào.

## 8. Cấu trúc file

```
Lead.js             — Schema: trường, enum phân loại, validate, câu lệnh tạo bảng
leadsService.js     — Logic nghiệp vụ: gắn nhãn, kịch bản follow-up, làm giàu dữ liệu
leadsController.js  — Tầng HTTP: đọc request → gọi service → trả response
leadsRoutes.js      — Khai báo 2 endpoint
adminAuth.js        — Xác thực Admin cho GET /api/leads
db.js               — Kết nối database + khởi tạo schema
app.js              — Lắp ráp Express app
index.js            — Điểm khởi chạy
env.js              — Gom biến môi trường
asyncHandler.js     — Bọc handler async để lỗi đi đúng về errorHandler
errorHandler.js     — Middleware bắt lỗi
notFound.js         — Middleware 404
test-leads.js       — Bộ test tự động cho thuật toán phân loại
db-schema.md        — Tài liệu schema (kèm bản Mongoose tương đương)
edge-cases.md       — Các tình huống biên đã xử lý
```

## 9. Giới hạn đã biết (bản demo)

- Token admin là UUID lưu DB, **không phải JWT có hạn dùng** — production cần thay bằng JWT + refresh token.
- CORS mở cho mọi origin để demo chạy từ `file://` — production phải siết theo domain thật.
- Chưa có rate limit cho `POST /api/leads` (endpoint công khai) — xem `edge-cases.md`.
