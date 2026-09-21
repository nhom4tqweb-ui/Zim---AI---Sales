# ZIM Academy — Backend 3

Backend cho 3 nhiệm vụ được giao:
1. Sinh mã đơn hàng & dữ liệu VietQR.
2. Webhook/Cronjob đối soát biến động số dư ngân hàng → cấp quyền học.
3. Web Push Notification nhắc bài tập.

Stack: **Node.js + Express + MongoDB (Mongoose)** — theo quyết định chung của nhóm.

## Cài đặt

```bash
npm install
cp .env.example .env
# điền MONGO_URI, thông tin ngân hàng, WEBHOOK_API_KEY hoặc WEBHOOK_HMAC_SECRET, VAPID keys...
npx web-push generate-vapid-keys   # dán kết quả vào VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
npm run dev
```

Server chạy tại `http://localhost:4000`, health check: `GET /health`.

## API Endpoints

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/v1/orders/create` | Tạo đơn hàng, trả về dữ liệu render VietQR |
| GET  | `/api/v1/orders/:orderCode` | FE polling trạng thái đơn hàng |
| POST | `/api/v1/payments/webhook` | Nhận IPN từ SePay/Casso/ngân hàng (cần header xác thực) |
| GET  | `/api/v1/notifications/vapid-public-key` | Lấy public key để FE subscribe push |
| POST | `/api/v1/notifications/subscribe` | Lưu push subscription của học viên |
| POST | `/api/v1/notifications/send-reminder` | Gửi nhắc bài tập thủ công tới 1 học viên |

Ví dụ tạo đơn:
```bash
curl -X POST http://localhost:4000/api/v1/orders/create \
  -H "Content-Type: application/json" \
  -d '{"student_id":"66f0a1...","course_id":"66f0b2...","amount":990000}'
```

## Cấu hình webhook phía SePay/Casso

1. Dashboard → Webhooks → Thêm webhook, URL trỏ tới `https://<domain-cua-ban>/api/v1/payments/webhook`.
2. Chọn phương thức xác thực **API Key** (đơn giản, đủ dùng) hoặc **HMAC-SHA256** (an toàn hơn, khuyến nghị) — tương ứng cấu hình `WEBHOOK_API_KEY` hoặc `WEBHOOK_HMAC_SECRET` trong `.env`.
3. Nội dung chuyển khoản của khách **bắt buộc phải chứa `orderCode`** (vd: `ZIM240917A1B2C3`) để hệ thống đối soát tự động — cần hiển thị rõ mã này trên UI thanh toán cho khách copy/nhớ.

## Tài liệu chi tiết

- [`docs/sequence-diagrams.md`](./docs/sequence-diagrams.md) — sơ đồ luồng (Mermaid) cho cả 4 luồng: tạo đơn, webhook, cronjob backup, push notification.
- [`docs/db-schema.md`](./docs/db-schema.md) — schema đầy đủ 3 bảng `Orders`, `Enrollments`, `PushSubscriptions`.
- [`docs/edge-cases.md`](./docs/edge-cases.md) — chi tiết cách xử lý 8 nhóm edge case (chuyển sai tiền, đơn đã huỷ, webhook trùng, race condition, v.v...).

## Ghi chú tích hợp với các phần khác của nhóm

- **FE 3 (Push Notification):** cần import model/service Bài tập thật vào `src/jobs/reminderJob.js` (hàm `getUpcomingDeadlines`) — hiện đang để dạng placeholder vì model Assignment không thuộc phạm vi Backend 3.
- **Backend chung:** `studentId`/`courseId` được coi là `ObjectId` tham chiếu tới collection User/Course do phần khác của nhóm quản lý — chưa có ràng buộc FK ở tầng DB (đặc thù MongoDB), validate ở tầng service khi cần.
