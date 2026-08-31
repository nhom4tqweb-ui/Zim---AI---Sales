-- ==========================================================
-- schema.sql
-- Cấu trúc CSDL demo cho Module "Modal chốt khóa học (Step 5)"
-- thuộc AI Interactive Sales Funnel - Trung tâm Anh ngữ ZIM
-- ==========================================================

CREATE DATABASE IF NOT EXISTS zim_sales_funnel
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zim_sales_funnel;

-- --------------------------------------------------------
-- Bảng courses: lưu thông tin khóa học (tối giản, phục vụ demo)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id            VARCHAR(50)   NOT NULL PRIMARY KEY,   -- vd: 'ielts-65-cap-toc'
  name          VARCHAR(255)  NOT NULL,
  original_price DECIMAL(12,0) NOT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Bảng enrollments: lưu đơn đăng ký / giao dịch của học viên
-- (Đây là bảng chính phục vụ Modal Step 5 - Chốt đơn & Cổng thanh toán)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Mã đăng ký duy nhất, dùng làm nội dung chuyển khoản
  -- Cú pháp CK chuẩn: [MãĐăngKý] - [SĐT] - [TênHọcViên]
  order_code        VARCHAR(30)     NOT NULL UNIQUE,

  -- Thông tin khóa học tại thời điểm đăng ký (snapshot, không JOIN
  -- để tránh sai lệch nếu giá khóa học thay đổi về sau)
  course_id         VARCHAR(50)     NOT NULL,
  course_name       VARCHAR(255)    NOT NULL,

  -- Thông tin học viên
  student_name      VARCHAR(150)    NOT NULL,
  student_phone     VARCHAR(15)     NOT NULL,
  student_email     VARCHAR(150)    NULL,

  -- Thông tin giá & ưu đãi
  original_price    DECIMAL(12,0)   NOT NULL,
  discount_percent  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  final_price       DECIMAL(12,0)   NOT NULL,

  -- Thông tin thanh toán VietQR
  transfer_content  VARCHAR(255)    NOT NULL,   -- Nội dung CK chuẩn hóa
  qr_url            TEXT            NOT NULL,   -- URL ảnh QR từ img.vietqr.io

  -- Trạng thái đơn hàng: pending (chờ TT) | paid (đã TT) | expired (hết hạn giữ chỗ)
  payment_status    ENUM('pending','paid','expired') NOT NULL DEFAULT 'pending',

  -- Thời gian
  expired_at        DATETIME        NOT NULL,   -- Hạn giữ ưu đãi (đồng bộ đồng hồ đếm ngược FE)
  paid_at           DATETIME        NULL,        -- Thời điểm xác nhận thanh toán thành công
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

  -- Khóa ngoại liên kết khóa học (tùy chọn, có thể bỏ nếu chỉ demo nhanh)
  CONSTRAINT fk_enrollments_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_student_phone (student_phone),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Dữ liệu mẫu (Seed data) để test nhanh khi demo/thuyết trình
-- --------------------------------------------------------
INSERT INTO courses (id, name, original_price) VALUES
  ('ielts-65-cap-toc', 'Combo IELTS 6.5+ Cấp Tốc', 3990000),
  ('giao-tiep-nen-tang', 'Giao Tiếp Nền Tảng 3 Tháng', 2490000)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Ví dụ 1 đơn hàng mẫu (không bắt buộc, chỉ để xem giao diện dữ liệu)
-- INSERT INTO enrollments
--   (order_code, course_id, course_name, student_name, student_phone,
--    original_price, discount_percent, final_price,
--    transfer_content, qr_url, payment_status, expired_at)
-- VALUES
--   ('DK2608310892', 'ielts-65-cap-toc', 'Combo IELTS 6.5+ Cấp Tốc',
--    'Nguyen Van A', '0987654321', 3990000, 25, 2990000,
--    'DK2608310892 - 0987654321 - Nguyen Van A',
--    'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=2990000&addInfo=...',
--    'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE));
