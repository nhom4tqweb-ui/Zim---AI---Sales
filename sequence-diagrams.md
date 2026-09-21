# Sequence Diagrams — ZIM Academy Backend 3

## 1. Tạo đơn hàng & render VietQR

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend API
    participant DB as MongoDB

    FE->>API: POST /api/v1/orders/create {student_id, course_id, amount}
    API->>API: generateOrderCode() (ZIM + date + random)
    API->>DB: insert Order {status: PENDING, expiresAt}
    alt orderCode bị trùng (hiếm)
        DB-->>API: E11000 duplicate key
        API->>API: retry với orderCode mới (tối đa 3 lần)
    end
    DB-->>API: Order created
    API->>API: buildVietQrQuickLink(bankBin, accountNo, amount, orderCode)
    API-->>FE: 201 {orderCode, amount, bankAccount, bankBin, quickLinkVietQR, expiresAt}
    FE->>FE: render <img src=quickLinkVietQR>
    FE->>API: (poll) GET /api/v1/orders/:orderCode mỗi vài giây
```

## 2. Webhook thanh toán — đối soát tự động

```mermaid
sequenceDiagram
    participant Bank as Ngân hàng / SePay / Casso
    participant MW as verifyWebhookSignature
    participant CTRL as paymentController
    participant SVC as paymentService
    participant DB as MongoDB

    Bank->>MW: POST /api/v1/payments/webhook (raw body + Authorization/HMAC header)
    alt chữ ký / API key sai
        MW-->>Bank: 401 Unauthorized
    end
    MW->>CTRL: next() (đã xác thực)
    CTRL->>SVC: processIncomingTransaction(txn)

    SVC->>DB: findOne Order where bankTransactionId = txn.id
    alt đã xử lý trước đó (idempotent)
        DB-->>SVC: Order found (đã PAID)
        SVC-->>CTRL: ALREADY_PROCESSED
        CTRL-->>Bank: 200 {success:true}
    end

    SVC->>SVC: extractOrderCodeFromContent(txn.content)
    alt không tìm thấy order code
        SVC-->>CTRL: UNMATCHED_NO_ORDER_CODE
        CTRL-->>Bank: 200 {success:true} (log để xử lý thủ công)
    end

    SVC->>DB: findOne Order {orderCode}
    alt order không tồn tại
        SVC-->>CTRL: UNMATCHED_ORDER_NOT_FOUND
        CTRL-->>Bank: 200 {success:true}
    else order.status == PAID
        SVC->>DB: push reconciliationLogs (khả năng chuyển trùng)
        SVC-->>CTRL: DUPLICATE_PAYMENT_ALREADY_PAID
        CTRL-->>Bank: 200 {success:true}
    else order.status == EXPIRED/CANCELED
        SVC->>DB: push reconciliationLogs (cần hoàn tiền thủ công)
        SVC-->>CTRL: PAYMENT_FOR_INACTIVE_ORDER
        CTRL-->>Bank: 200 {success:true}
    else order.status == PENDING/UNDERPAID
        SVC->>SVC: so sánh totalReceived vs order.amount
        alt thiếu tiền
            SVC->>DB: findOneAndUpdate {_id, status: hiện tại} -> status: UNDERPAID (guard race condition)
            SVC-->>CTRL: UNDERPAID
        else đủ / thừa tiền
            SVC->>DB: findOneAndUpdate {_id, status: hiện tại} -> status: PAID (atomic, chống race condition)
            alt update thất bại (request khác đã set PAID trước)
                SVC-->>CTRL: RACE_CONDITION_RESOLVED_BY_OTHER_REQUEST
            else update thành công
                SVC->>DB: upsert Enrollment {studentId, courseId} status ACTIVE (idempotent)
                SVC-->>CTRL: PAID / PAID_OVERPAID
            end
        end
        CTRL-->>Bank: 200 {success:true}
    end
```

## 3. Cronjob đối soát backup (khi webhook bị lỡ)

```mermaid
sequenceDiagram
    participant Cron as node-cron (mỗi 5 phút)
    participant JOB as reconciliationJob
    participant Gateway as Bank Gateway API (list transactions)
    participant SVC as paymentService
    participant DB as MongoDB

    Cron->>JOB: trigger
    JOB->>DB: updateMany Order {status:PENDING, expiresAt < now} -> EXPIRED
    JOB->>Gateway: GET /transactions/list?since=30min (Bearer token)
    Gateway-->>JOB: [transactions...]
    loop mỗi giao dịch
        JOB->>SVC: processIncomingTransaction(txn, source=CRONJOB)
        Note over SVC,DB: Cùng 1 hàm xử lý như webhook -> tự động<br/>bỏ qua nếu bankTransactionId đã tồn tại (idempotent)
    end
```

## 4. Web Push — subscribe & gửi nhắc bài tập

```mermaid
sequenceDiagram
    participant FE as Frontend (Service Worker)
    participant API as Backend API
    participant DB as MongoDB
    participant Browser as Push Service (FCM/Mozilla)

    FE->>API: GET /api/v1/notifications/vapid-public-key
    API-->>FE: {publicKey}
    FE->>Browser: PushManager.subscribe(publicKey)
    Browser-->>FE: PushSubscription {endpoint, keys}
    FE->>API: POST /api/v1/notifications/subscribe {student_id, subscription}
    API->>DB: upsert PushSubscription (unique endpoint)
    API-->>FE: 201 Created

    Note over API: Cronjob reminderJob (mỗi 15 phút) HOẶC trigger thủ công
    API->>DB: find PushSubscription {studentId, isActive:true}
    API->>Browser: webpush.sendNotification(subscription, payload)
    alt subscription hết hạn (404/410)
        Browser-->>API: 410 Gone
        API->>DB: set isActive=false
    else gửi thành công
        Browser-->>API: 201 Created
        Browser->>FE: push event -> Service Worker hiển thị notification
    end
```
