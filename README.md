# BE — Khởi tạo Server & Database

Code cho task "Khởi tạo Server & Database" trong đồ án.

## Cấu trúc thư mục

```
BE/
├── .env.example          # copy thành .env và điền giá trị thật
├── package.json
├── server.js             # entry point
├── src/
│   ├── app.js             # cấu hình express, cors, gắn route + middleware lỗi
│   ├── config/
│   │   └── db.js          # kết nối MongoDB (mongoose)
│   ├── middlewares/
│   │   ├── notFound.js    # bắt lỗi 404
│   │   └── errorHandler.js# xử lý lỗi tập trung, tránh crash server
│   ├── models/
│   │   └── Schedule.js    # model lịch học
│   └── routes/
│       └── schedule.routes.js  # GET /api/schedules/:studentId
├── scripts/
│   ├── db-start.sh        # chạy mongod local
│   ├── db-dump.sh         # sao lưu dữ liệu test ra backups/
│   └── db-restore.sh      # khôi phục từ bản dump gần nhất
├── data/db/                # nơi mongod lưu dữ liệu khi chạy local
└── backups/                 # nơi lưu các bản dump

```

## Cài đặt & chạy

```bash
cd BE
npm install
cp .env.example .env        # chỉnh PORT / MONGO_URI nếu cần
npm run dev                 # hoặc: npm start
```

## Dùng script quản lý dữ liệu

```bash
./scripts/db-start.sh       # nếu chạy Mongo local (không dùng Docker/Atlas)
./scripts/db-dump.sh        # sao lưu dữ liệu hiện tại
./scripts/db-restore.sh     # khôi phục từ bản dump gần nhất
```

## API đã có

- `GET /api/schedules/:studentId` — trả về danh sách lịch học của học viên,
  dùng cho FE 3 để kích hoạt popup nhắc lịch.

## Việc cần làm tiếp

- Viết seed script để tạo dữ liệu Schedule mẫu.
- Thêm validate input (vd. dùng `express-validator` hoặc `joi`) cho các route sau này.
- Khi lên production, giới hạn `cors()` về đúng domain của FE thay vì mở toàn bộ.
