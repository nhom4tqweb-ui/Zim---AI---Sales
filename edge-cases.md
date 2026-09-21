# Các tình huống biên đã xử lý (BE2)

Tài liệu này ghi lại những trường hợp dễ gây **lỗi thầm lặng** — chạy vẫn ra kết quả, không báo lỗi gì, nhưng dữ liệu sai — và cách hệ thống xử lý.

---

## 1. Nhãn phân loại bị tụt hạng ⚠️ nghiêm trọng nhất

**Tình huống:** Khách đã mở màn hình thanh toán (`da_de_lai_thong_tin_thanh_toan`), sau đó quay lại sửa câu trả lời khảo sát. Lần gọi API này payload chỉ có dữ liệu khảo sát, không có `microTestBands` cũng không có `reachedCheckout`.

**Nếu xử lý sai:** Tính lại nhãn từ đầu rồi gán đè → khách tụt về `da_dien_form`. Đội Sales mất dấu đúng nhóm khách **nóng nhất** (đã gần chốt đơn), mà không có bất kỳ cảnh báo nào.

**Cách xử lý:** Mỗi nhãn có thứ hạng (`RANK` 1→3). Khi cập nhật, so sánh nhãn suy ra với nhãn đã lưu và **giữ lại nhãn cao hơn**:

```js
return RANK[target] > RANK[hienTai] ? target : hienTai;
```

---

## 2. Cập nhật nhầm dòng khi lead được tra theo `phone`

**Tình huống:** Khách điền khảo sát trên điện thoại (session A), vài ngày sau mở lại trên máy tính (session B) và nhập cùng số điện thoại.

**Nếu xử lý sai:** Tra lead cũ theo `phone` (tìm thấy dòng của session A), nhưng câu `UPDATE` lại dùng `WHERE session_id = ?` với session B → **không khớp dòng nào**, update âm thầm không làm gì cả. Dữ liệu mới mất trắng, không báo lỗi.

**Cách xử lý:** Luôn `UPDATE ... WHERE id = ?` bằng khóa chính của dòng vừa tìm được, bất kể tìm thấy qua đường nào.

---

## 3. Khách đầu phễu chưa có tên / SĐT / email

**Tình huống:** Ở bước đầu, khách mới chỉ chọn mục tiêu học, chưa để lại thông tin liên hệ nào.

**Nếu xử lý sai:** Bắt buộc `name`/`phone`/`email` → request bị từ chối → **mất sạch lead đầu phễu**, đúng nhóm đông nhất.

**Cách xử lý:** Chỉ bắt buộc `sessionId`. Các trường liên hệ để trống, điền dần ở các bước sau. Validate định dạng **chỉ khi** trường đó có giá trị.

---

## 4. Lead rời rạc khi khách xóa `sessionStorage`

**Tình huống:** Khách xóa dữ liệu trình duyệt giữa chừng, chưa từng để lại số điện thoại → session mới hoàn toàn.

**Hệ quả:** Tạo lead mới, tách rời lead cũ. **Chấp nhận được** ở bản demo vì không còn khóa nào để gộp (chưa có phone, chưa có tài khoản).

**Hướng cải thiện:** Thêm fingerprint trình duyệt, hoặc gộp thủ công trên màn hình Admin.

---

## 5. `undefined` khi bind tham số SQL

**Tình huống:** Payload thiếu trường nào đó → giá trị là `undefined`.

**Nếu xử lý sai:** libSQL/SQLite **không nhận** `undefined` làm tham số bind, ném lỗi `Provided value cannot be bound to SQLite parameter` → cả request hỏng.

**Cách xử lý:** Hàm `nullNeuUndefined()` trong `Lead.js` ép mọi `undefined` về `null` trước khi bind.

---

## 6. Điểm Micro Test sai kiểu hoặc ngoài thang 0-9

**Tình huống:** Client gửi `microTestBands: {"Listening": "sáu"}` hoặc `{"Reading": 99}`.

**Nếu xử lý sai:** Ghi thẳng vào DB → hàm tính band trung bình trả ra `NaN` → màn hình CRM hiện `NaN`, Sales không đọc được gì.

**Cách xử lý:** `validateLeadPayload()` kiểm tra từng kỹ năng phải là **số trong khoảng 0-9**, sai thì trả 400 kèm thông báo rõ ràng. Hàm `tinhBandTrungBinh()` còn lọc thêm một lớp (`typeof v === 'number'`) trước khi tính.

---

## 7. Lỗi async không đi về được middleware bắt lỗi

**Tình huống:** Một truy vấn DB trong handler `async` bị lỗi (mất kết nối, khóa file...).

**Nếu xử lý sai:** Express 4 **không tự bắt** Promise reject từ handler `async` → lỗi thành *unhandled rejection*, client treo không nhận được response nào.

**Cách xử lý:** Mọi handler được bọc qua `asyncHandler()`, chuyển reject về `next(err)` để `errorHandler.js` trả JSON đúng chuẩn.

---

## 8. N+1 query khi danh sách lead dài

**Tình huống:** `GET /api/leads` cần nối đơn hàng và kết quả chẩn đoán cho **từng** lead.

**Nếu xử lý sai:** Truy vấn trong vòng lặp → 100 lead = **201 truy vấn**, API chậm dần theo số lượng khách.

**Cách xử lý:** Nạp theo lô đúng **2 truy vấn** (toàn bộ orders, toàn bộ assessment_results), đưa vào `Map` rồi ghép trong bộ nhớ. Số truy vấn không đổi dù bao nhiêu lead.

---

## 9. Ngày giờ không hợp lệ khi tính "khẩn cấp"

**Tình huống:** `updated_at` bị hỏng/null → `new Date(...)` ra `Invalid Date`.

**Cách xử lý:** `Math.max(0, ...)` chặn giá trị âm; phép so sánh với `Invalid Date` luôn trả `false` nên `isUrgent` mặc định về `false` — an toàn (chỉ bỏ sót cảnh báo, không tạo cảnh báo giả làm nhiễu đội Sales).

---

## 10. Chưa xử lý — giới hạn đã biết

| Vấn đề | Rủi ro | Hướng xử lý khi lên production |
|---|---|---|
| `POST /api/leads` công khai, **không rate limit** | Bị spam tạo lead rác | Thêm `express-rate-limit` theo IP + captcha ở form |
| Token admin không hết hạn | Token lộ thì dùng được mãi | Đổi sang JWT có `exp` + refresh token |
| CORS mở cho mọi origin | Trang khác gọi được API | Chỉ cho phép đúng domain thật |
| Dữ liệu cá nhân lưu dạng thô | Không đạt chuẩn bảo vệ dữ liệu | Mã hóa cột nhạy cảm, ghi log truy cập |
