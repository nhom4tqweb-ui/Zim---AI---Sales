# Xử lý Edge Cases

## 1. Khách chuyển sai số tiền

| Trường hợp | Xử lý |
|---|---|
| **Chuyển thiếu** (ngoài `AMOUNT_TOLERANCE`) | Order chuyển sang `UNDERPAID`, cộng dồn `amountReceived`. Chưa cấp quyền học. Khi khách chuyển tiếp phần còn thiếu (transactionId mới, cùng `orderCode` trong content), hệ thống cộng dồn tiếp; đủ thì tự chuyển `PAID`. |
| **Chuyển thừa** | Order vẫn được set `PAID` (không block việc học vì lỗi không phải do học viên), nhưng được đánh dấu `PAID_OVERPAID` và ghi log `reconciliationLogs` để đội tài chính hoàn lại phần dư thủ công. |
| **Tolerance** | `AMOUNT_TOLERANCE` (.env) cho phép sai lệch nhỏ (vd phí ngân hàng làm tròn 1-2đ) không bị coi là thiếu/thừa. |

## 2. Chuyển khoản lại cho đơn đã hủy / hết hạn

- Order ở trạng thái `CANCELED` hoặc `EXPIRED` mà vẫn nhận được giao dịch khớp `orderCode` → **không tự động cấp quyền học**.
- Lý do: đơn đã hết hạn có thể do khách đổi ý / tạo đơn mới với giá đã thay đổi (khuyến mãi hết hạn, giá khóa học đổi). Tự động kích hoạt lại có rủi ro nghiệp vụ (giá sai).
- Hệ thống ghi `reconciliationLogs` với note rõ ràng → hiển thị trên dashboard vận hành để nhân viên xử lý thủ công (hoàn tiền hoặc tạo đơn mới bù trừ).

## 3. Webhook bị gọi lại nhiều lần (retry / duplicate delivery)

- **Cơ chế chống trùng chính:** unique index trên `bankTransactionId`. Trước khi xử lý bất kỳ logic nào, service kiểm tra đã tồn tại Order nào có `bankTransactionId` này chưa — nếu có, trả về `ALREADY_PROCESSED` ngay lập tức, không xử lý lại.
- Route webhook **luôn trả HTTP 200** sau khi xác thực chữ ký thành công (dù match được đơn hay không), đúng theo chính sách retry của SePay: cổng chỉ retry khi có lỗi mạng/kết nối, không dựa vào nội dung response — nên trả 200 sớm giúp tránh retry storm không cần thiết.
- **Chỉ trả về 401** khi xác thực chữ ký/API key thất bại (request không đáng tin).

## 4. Race Condition — 2 request cùng cập nhật 1 Order

- Kịch bản: webhook thật + cronjob backup cùng quét thấy 1 giao dịch trong khoảng thời gian gần nhau, cả 2 cùng cố gắng set Order sang `PAID`.
- Giải pháp: dùng **atomic conditional update** —
  ```js
  Order.findOneAndUpdate(
    { _id: order._id, status: order.status }, // điều kiện: status CHƯA đổi kể từ lúc đọc
    { $set: { status: 'PAID', ... } },
    { new: true }
  )
  ```
  MongoDB đảm bảo chỉ **1 trong 2** request khớp điều kiện và thắng cuộc; request thua sẽ nhận `null` và trả về `RACE_CONDITION_RESOLVED_BY_OTHER_REQUEST` — không throw lỗi, không cấp quyền học 2 lần.
- Việc cấp quyền học (`Enrollment`) dùng `upsert` với unique index `{studentId, courseId}` → dù có gọi `grantCourseAccess()` nhiều lần cũng không tạo bản ghi trùng (idempotent theo thiết kế, không cần Redis lock ở bước này).
- Nếu deploy trên MongoDB Replica Set / Atlas, có thể nâng cấp lên `session.withTransaction()` để atomic tuyệt đối giữa update Order + tạo Enrollment (xem comment cuối `paymentService.js`).

## 5. Order không tìm thấy mã đơn trong nội dung chuyển khoản

- Khách ghi sai nội dung chuyển khoản (thiếu, sai chính tả `orderCode`) → hệ thống trả `UNMATCHED_NO_ORDER_CODE`, không có gì để đối soát tự động.
- Khuyến nghị vận hành: dashboard admin cần trang "Giao dịch chưa đối soát" liệt kê các giao dịch dạng này để nhân viên tra cứu thủ công theo tên/số tài khoản người chuyển và gán tay vào đúng Order.

## 6. Webhook server down đúng lúc có giao dịch (webhook bị lỡ hoàn toàn)

- SePay/Casso có retry theo lỗi mạng nhưng không đảm bảo retry vô hạn.
- `reconciliationJob` (cronjob mỗi 5 phút) gọi API "danh sách giao dịch" của cổng để quét lại các giao dịch trong 30 phút gần nhất và chạy lại **cùng một hàm** `processIncomingTransaction()` như webhook → tự động bắt kịp các giao dịch bị lỡ, vẫn đảm bảo idempotent nhờ check `bankTransactionId`.

## 7. Push subscription hết hạn / bị thu hồi

- Trình duyệt/OS có thể tự huỷ subscription (gỡ cài đặt, xoá dữ liệu trình duyệt, hết hạn theo chính sách push service).
- Khi gửi mà push service trả về `404`/`410`, `pushService.sendToSubscription()` tự động set `isActive: false` cho bản ghi đó — job sau sẽ không cố gửi lại tới subscription chết nữa. Không throw lỗi làm gián đoạn việc gửi cho các học viên khác trong cùng batch.

## 8. Sinh trùng `orderCode`

- Xác suất cực thấp (random 6 ký tự trên bảng 32 ký tự = 32⁶ khả năng/ngày), nhưng vẫn xử lý: `createOrder()` bắt lỗi `E11000` trên unique index `orderCode` và tự sinh lại mã mới, tối đa 3 lần thử.
