<<<<<<< HEAD
# Demo: Modal Chốt Khóa Học (Step 5) — AI Interactive Sales Funnel

Bài tập lớn môn **Biên tập Web** — Website tư vấn & quản lý học viên trung tâm tiếng Anh.

Module này hiện thực hoá **Step 5** trong sơ đồ funnel: *"Chốt đơn & Cổng thanh toán"* —
Modal có đồng hồ đếm ngược, form thông tin học viên, và mã VietQR tự sinh.

## 1. Cấu trúc thư mục

```
zim-payment-modal/
├── frontend/
│   ├── index.html          # Trang demo + cấu trúc Modal Step 5
│   ├── css/style.css        # Style toàn bộ modal (responsive)
│   └── js/
│       ├── countdown.js     # Logic đồng hồ đếm ngược (FOMO)
│       └── modal.js         # Mở/đóng modal, gọi API, hiển thị QR, polling
├── backend/
│   ├── server.js            # Điểm khởi chạy Express
│   ├── routes/orders.js     # Định nghĩa endpoint /api/orders
│   ├── controllers/
│   │   └── orderController.js  # Logic tạo đơn, tính giá, sinh VietQR URL
│   ├── config/db.js         # Kết nối MySQL (connection pool)
│   ├── package.json
│   └── .env.example         # Mẫu biến môi trường (copy thành .env)
└── database/
    └── schema.sql           # Câu lệnh tạo bảng courses & enrollments
```

## 2. Cách chạy demo

### Bước 1 — Cài đặt MySQL & tạo CSDL
```bash
mysql -u root -p < database/schema.sql
```

### Bước 2 — Cài đặt & chạy Backend
```bash
cd backend
npm install
cp .env.example .env      # rồi chỉnh sửa thông tin DB + tài khoản ngân hàng
npm run dev                # chạy bằng nodemon (hoặc: npm start)
```
Server chạy tại: `http://localhost:3000`

### Bước 3 — Mở Frontend
Mở trực tiếp file `frontend/index.html` bằng trình duyệt
(hoặc dùng extension "Live Server" trong VS Code để tránh lỗi CORS/file://).

> Lưu ý: đảm bảo `API_BASE_URL` trong `frontend/js/modal.js` trỏ đúng
> tới địa chỉ backend đang chạy.

## 3. Luồng hoạt động (giải thích khi thuyết trình)

1. Học viên bấm **"Chốt suất ưu đãi ngay"** → Modal Step 5 mở ra, đồng hồ
   đếm ngược 10 phút bắt đầu chạy (`countdown.js`) tạo tâm lý khan hiếm.
2. Học viên điền **Họ tên / SĐT / Email** vào form.
3. Khi submit, Frontend gọi `POST /api/orders` → Backend:
   - Sinh **mã đăng ký** duy nhất (`DK + ngày + số random`)
   - Tính **giá sau ưu đãi** và **% giảm giá**
   - Xây dựng **nội dung chuyển khoản chuẩn**: `[MãĐăngKý] - [SĐT] - [TênHọcViên]`
   - Gọi API công khai của **VietQR.io** để sinh URL ảnh mã QR động
     (đã nhúng sẵn số tiền + nội dung CK, học viên chỉ cần quét & bấm xác nhận)
   - Lưu toàn bộ đơn hàng vào bảng `enrollments` trong MySQL
4. Backend trả `qrUrl`, `orderCode`, `transferContent` về Frontend →
   Modal chuyển sang hiển thị **khung QR + thông tin chuyển khoản**.
5. Frontend **polling** mỗi 4 giây gọi `GET /api/orders/:code/status`
   để kiểm tra học viên đã thanh toán chưa (mô phỏng luồng "thanh toán
   không chạm" — không cần nhân viên xác nhận thủ công).
6. Khi nhận diện thanh toán thành công (`payment_status = 'paid'`),
   giao diện tự cập nhật "✅ Thanh toán thành công".

## 4. Điểm mở rộng khi triển khai thực tế

- Thay polling bằng **Webhook** từ cổng trung gian đối soát giao dịch
  ngân hàng (VD: SePay, Casso, Momo Business) để xác nhận realtime,
  chính xác 100% thay vì đoán qua polling.
- Thêm **cron job** tự động cập nhật `payment_status = 'expired'` cho
  các đơn quá hạn `expired_at` chưa thanh toán, giải phóng slot ưu đãi.
- Mã hoá / xác thực dữ liệu học viên (input sanitization, rate-limit
  API `POST /orders` để tránh spam tạo đơn ảo).
- Đồng bộ dữ liệu `enrollments` sang hệ thống CRM quản lý học viên
  (Google Sheet/CRM nội bộ) qua API hoặc cron export.

## 5. VietQR API tham khảo

Tài liệu chính thức: https://www.vietqr.io/danh-sach-api

Cấu trúc URL sinh ảnh QR động (đang dùng trong `orderController.js`):
```
https://img.vietqr.io/image/{BANK_BIN}-{SO_TAI_KHOAN}-{TEMPLATE}.png
  ?amount={SO_TIEN}
  &addInfo={NOI_DUNG_CHUYEN_KHOAN}
  &accountName={TEN_CHU_TAI_KHOAN}
```

