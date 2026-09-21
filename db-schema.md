# Database Schema (MongoDB / Mongoose)

Theo quyết định của nhóm (Node.js + MongoDB làm backend chính), toàn bộ schema dưới đây dùng Mongoose.

## Orders

| Field                | Type      | Ghi chú |
|----------------------|-----------|---------|
| `orderCode`          | String    | Unique. Dạng `ZIM` + `YYMMDD` + 6 ký tự alphanumeric. |
| `studentId`          | ObjectId  | Ref học viên (module Auth/User). |
| `courseId`           | ObjectId  | Ref khóa học / lộ trình. |
| `amount`             | Number    | Số tiền cần thanh toán (VND). |
| `amountReceived`     | Number    | Tổng tiền đã nhận (phục vụ case chuyển thiếu/thừa). |
| `status`             | Enum      | `PENDING \| PAID \| EXPIRED \| CANCELED \| OVERPAID \| UNDERPAID` |
| `expiresAt`          | Date      | Thời điểm QR hết hạn. |
| `bankTransactionId`  | String    | Unique, sparse. ID giao dịch ngân hàng — **khóa chống trùng (idempotency key)**. |
| `matchedGateway`     | String    | Tên ngân hàng khớp lệnh, vd `Vietcombank`. |
| `matchedContent`     | String    | Nội dung chuyển khoản gốc, phục vụ audit. |
| `paidAt`             | Date      | Thời điểm ghi nhận PAID. |
| `reconciliationLogs` | Array     | Lịch sử mỗi lần webhook/cronjob chạm vào order (audit trail). |
| `createdAt/updatedAt`| Date      | Tự động (timestamps). |

**Indexes quan trọng:**
- `{ orderCode: 1 }` unique — tra cứu theo mã đơn khi đối soát.
- `{ bankTransactionId: 1 }` unique, sparse — chặn xử lý trùng 1 giao dịch ngân hàng 2 lần.
- `{ status: 1, expiresAt: 1 }` — cronjob quét đơn PENDING hết hạn hiệu quả.

## Enrollments (UserCourses)

| Field         | Type      | Ghi chú |
|---------------|-----------|---------|
| `studentId`   | ObjectId  | |
| `courseId`    | ObjectId  | |
| `orderId`     | ObjectId  | Ref Order đã cấp quyền này. |
| `status`      | Enum      | `ACTIVE \| REVOKED` |
| `grantedAt`   | Date      | |
| `revokedAt`   | Date      | null nếu còn active. |

**Index:** `{ studentId: 1, courseId: 1 }` unique — đảm bảo 1 học viên chỉ có 1 bản ghi active/khóa học, đồng thời cho phép **upsert idempotent** khi webhook gọi lại nhiều lần.

## PushSubscriptions

| Field        | Type      | Ghi chú |
|--------------|-----------|---------|
| `studentId`  | ObjectId  | |
| `endpoint`   | String    | Unique — định danh duy nhất của 1 subscription (1 trình duyệt/thiết bị). |
| `keys.p256dh`| String    | Public key mã hóa payload (chuẩn Web Push). |
| `keys.auth`  | String    | Auth secret. |
| `userAgent`  | String    | Debug: biết học viên subscribe từ thiết bị/trình duyệt nào. |
| `isActive`   | Boolean   | Set `false` tự động khi push trả về 404/410 (subscription hết hạn). |

---

### Vì sao không dùng bảng SQL / quan hệ cứng?

Nhóm đã chọn MongoDB làm CSDL chính (xem quyết định của team), nên các "quan hệ" giữa Order ↔ Enrollment ↔ Student chỉ là tham chiếu `ObjectId` mềm, không có foreign key constraint ở tầng DB — validate quan hệ được xử lý ở tầng application (Mongoose + service layer) thay vì DB engine.
