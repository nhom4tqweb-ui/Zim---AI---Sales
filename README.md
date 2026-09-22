# ZIM Sales AI Demo (v1.1)

Prototype cho phần **Chatbot tư vấn nổi góc phải + Modal chúc mừng hoàn thành khóa học kèm voucher thi IELTS**.

## 1. Chạy dự án

Yêu cầu Node.js 18 trở lên. Không cần `npm install` vì chỉ dùng module có sẵn của Node.

```bash
npm start
```

Mở `http://localhost:3000`. Máy cần có mạng để tải Tailwind CDN và font Inter.

## 2. Có gì mới ở v1.1

| Vấn đề ở bản cũ | Cách sửa |
|---|---|
| Bot nói "không hứa chắc đầu ra", ngược với chính sách của ZIM | Nói đúng cam kết: không đạt điểm cam kết thì được tài trợ học lại và miễn phí thi lại |
| Gần như không có thông tin thật của ZIM | Thêm kho `server/zimKnowledge.js`: học phí, cam kết, sĩ số, hình thức học, lệ phí thi, ưu đãi, hotline, mỗi dữ kiện có link nguồn |
| Trả lời rào cản lại dán nguyên đoạn lộ trình | Lộ trình chỉ hiện một lần; sau đó chỉ hỏi "Bạn muốn tìm hiểu thêm phần nào?" |
| "1 khóa" bị hiểu thành band 1 | Bỏ các số đi kèm đơn vị (khóa, tháng, triệu, tuổi…) và kiểm tra thang điểm (IELTS 1.0–9.0, TOEIC 10–990) |
| Câu không hiểu thì lặp lại câu hỏi cũ mãi | Có câu trả lời dự phòng; sau 2 lần liên tiếp thì mời để lại SĐT/hotline |
| Không ghi nhận số điện thoại, câu chuyển tư vấn viên dùng từ kỹ thuật | Nhận diện SĐT Việt Nam, lưu lead vào `data/leads.json`, luôn kèm hotline 1900 2833 |
| Gõ tự do không được xác nhận lại | "Mình ghi nhận rồi nè: đang 4.5, mục tiêu 6.5, trong 4 tháng…" rồi chỉ hỏi phần còn thiếu |
| Phản đối học phí ghi đè điểm yếu khách đã chọn | Rào cản lưu riêng vào `concerns` |
| Voucher 300.000đ là con số tự đặt | Bỏ; modal chỉ hiện quyền lợi có nguồn: ưu đãi kèm theo khi đăng ký thi qua ZIM (lệ phí 4.664.000đ) và tặng 200.000đ khi thi thử |
| Người dùng thấy chữ kỹ thuật ("Integration point", "business rules"…) | Viết lại toàn bộ nội dung trang cho người dùng |
| Lời chào cứng | Chào tự nhiên, mỗi lượt chia thành nhiều bong bóng ngắn như nhắn tin thật |

## 3. Nguồn thông tin ZIM

Tất cả nằm ở `server/zimKnowledge.js`, đối chiếu lần cuối ngày 22/09/2026. **Kiểm tra lại trước buổi bảo vệ** vì học phí, ưu đãi có thể thay đổi.

- https://zim.vn/ : định vị, cam kết đầu ra các chương trình, sĩ số Micro 8/Standard 15/1-1, học phí TOEIC, học bổng, Giao tiếp 5 giai đoạn
- https://zim.vn/ielts : học phí IELTS từ 3.900.000đ, ưu đãi nhóm, hotline, đối tác British Council
- https://zim.vn/ielts/ielts-online : IELTS Online từ 7.900.000đ, lớp nhóm nhỏ, lớp cấp tốc, cam kết khóa online, khuyến khích học thử
- https://zim.vn/ielts/cap-toc-1-kem-1 : 1 kèm 1, video bài học bổ trợ, phòng tự học
- https://zim.vn/hoc-phi-ielts : lộ trình cá nhân hóa theo test đầu vào, giáo viên IELTS 7.5–8.5
- https://zim.vn/ielts/dang-ky-thi-ielts-tai-anh-ngu-zim : lệ phí thi 4.664.000đ, đăng ký trước ~2 tháng, thi thử tặng 200.000đ
- https://www.youtube.com/@zimacademy : câu cam kết "tài trợ học lại và miễn phí thi lại"

## 4. Cấu trúc

```text
server/
  zimKnowledge.js        # kho dữ kiện ZIM + nguồn (MỚI)
  conversationEngine.js  # state machine, trích xuất thông tin, xử lý rào cản (viết lại)
  recommendationEngine.js# lộ trình sơ bộ + điểm phù hợp lấy từ kho dữ kiện
  leadStore.js           # lưu SĐT/Zalo khách để lại (MỚI)
  voucherStore.js        # cấp mã, không tạo trùng
  llmAdapter.js          # (tùy chọn) LLM chỉ viết lại câu chữ, giữ nguyên dữ kiện
public/
  index.html, css/app.css
  js/main.js             # modal chúc mừng, voucher, nối với chatbot
  js/chat.js             # widget chat
  js/confetti.js         # pháo giấy + phiếu voucher mini
data/                    # tự sinh: vouchers.json, leads.json, analytics.ndjson
```

## 5. API

- `GET /api/chat/initial`: lời chào + gợi ý chọn nhanh
- `POST /api/chat/stream`: SSE. Sự kiện `meta` → nhiều `delta` → `break` (sang bong bóng mới) → `done`
- `GET /api/rewards/exam`: quyền lợi hiển thị trong modal
- `POST /api/vouchers/claim`: cấp mã (cùng user + khóa học → trả lại mã cũ)
- `POST /api/recommend`, `POST /api/events`, `GET /api/health`

## 6. Kịch bản test nhanh

**Luồng chính:** mở chat → `Tư vấn khóa IELTS` → `Du học` → `6.5` → `4.0–4.5` → `2–4 tháng` → `Buổi tối` → `Online` → `Writing/Speaking yếu` → thẻ lộ trình hiện ra.

**Gõ tự do:** `Mình đang 4.5, cần 6.5 trong 4 tháng, buổi tối khá bận và muốn học online.` → bot xác nhận đủ thông tin, chỉ hỏi mục đích.

**Rào cản:** `Mình thấy học phí cao quá` · `Mình sợ học xong không đạt` · `học online có hiệu quả không?` · `mình tự học được không`

**Câu hỏi thường gặp:** `lớp bao nhiêu người` · `giáo viên trình độ thế nào` · `có học bổng không` · `muốn đăng ký thi ielts` · `có luyện SAT không`

**Chuyển tư vấn viên:** `Mình muốn nói chuyện với người thật qua Zalo` → `0912 345 678` → kiểm tra `data/leads.json`.

**Câu lạ:** `thời tiết hôm nay thế nào` → trả lời dự phòng; gõ tiếp một câu lạ → mời để lại SĐT.

**Voucher:** `Mô phỏng hoàn thành khóa học` → pháo giấy + phiếu voucher → `Nhận quà` → hiện mã → `Đăng ký thi qua ZIM` → chat mở sẵn phần đăng ký thi. Đóng modal bằng `Để sau` → chatbot nhắn chúc mừng.

## 7. Ghép vào website nhóm

- Mini Test (Step 2): lắng nghe `window.addEventListener('zim:open-step', e => …)`; `e.detail.profile` chứa thông tin khách đã khai trong chat.
- Mở modal từ dashboard: `window.ZIMCompletionReward.open({ courseId, courseName })`. Nếu chat đang trả lời hoặc khách đang gõ, modal tự chờ.
