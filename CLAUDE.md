# BRAND IDENTITY GUIDELINES FOR ZIM SALES AI DEMO

## Quy định cứng từ tài liệu chung
- Framework: HTML5 + Tailwind CSS qua CDN để demo nhanh.
- Primary Color: Red ZIM `#B91C1C` -> `bg-red-700`, `text-red-700`.
- Tech/AI Color: Indigo `#4F46E5` -> `bg-indigo-600`, `text-indigo-600`.
- Neutral Font: Inter / Sans-serif -> `font-sans text-slate-800`.
- Background: Light Gray `#F8FAFC` -> `bg-slate-50`.
- Component Box: `rounded-2xl`, `bg-white`, `border border-slate-200`, `shadow-sm`.
- CTA chính: `bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-6 rounded-xl transition duration-200`.
- AI Badge: `inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200`.

## Typography
- H1: `text-3xl md:text-5xl font-extrabold tracking-tight` hoặc lớn hơn có kiểm soát ở Hero.
- H2: `text-2xl md:text-3xl font-bold`.
- H3: `text-lg md:text-xl font-semibold`.
- Body: `text-sm md:text-base font-normal leading-relaxed`.
- Caption / Badge: `text-xs font-semibold tracking-wide uppercase`.

## Component rules
- Card/form/modal: bo góc 12-16px, viền Slate 200, nền trắng.
- Shadow nhẹ ở trạng thái thường; hover card có thể `-translate-y-1` + `shadow-lg`.
- Mọi tính năng AI phải có nhãn `AI Tư vấn` hoặc `ZIM AI Consultant`.
- Tránh màu đen tuyệt đối cho text; dùng Slate 800.
- Success/trust dùng Emerald 600 `#059669`.

## Quy tắc nội dung (bắt buộc)
- Mọi dữ kiện về ZIM (học phí, cam kết đầu ra, sĩ số, hình thức học, lệ phí thi, ưu đãi, hotline) CHỈ lấy từ `server/zimKnowledge.js`, mỗi dữ kiện có link nguồn zim.vn hoặc kênh chính thức của ZIM.
- Không viết số liệu trực tiếp vào kịch bản; muốn thêm dữ kiện thì thêm vào `zimKnowledge.js` kèm nguồn.
- Không tự tạo lịch khai giảng, ưu đãi theo đợt, điều kiện cam kết hay mức giảm voucher. Phần cần xác nhận theo thời điểm → chuyển tư vấn viên / hotline 1900 2833.
- Không phủ nhận cam kết đầu ra: ZIM có cam kết (không đạt điểm cam kết thì được tài trợ học lại và miễn phí thi lại).
- Giao diện người dùng không hiển thị thuật ngữ kỹ thuật (handoff, business rules, module, integration...).

## Quy tắc nghiệp vụ chatbot
- Chatbot fixed góc phải, không gây layout shift.
- State machine quyết định bước nghiệp vụ; LLM (nếu bật) chỉ làm tự nhiên câu chữ.
- Không hỏi lại dữ liệu đã biết.
- Mỗi lượt chỉ nên có một câu hỏi chính.
- Không bắt người dùng nhập SĐT trước khi nhận được giá trị tư vấn.
- Chuyển tư vấn viên khi người dùng yêu cầu hoặc khi dữ liệu cần xác nhận theo thời điểm: xin SĐT/Zalo, luôn kèm hotline.
- Mỗi lượt trả lời chia thành các bong bóng ngắn (tối đa ~4), câu hỏi tiếp theo nằm ở bong bóng cuối.
- Câu không hiểu: trả lời dự phòng, tối đa 2 lần liên tiếp rồi mời để lại SĐT/hotline; không lặp lại câu hỏi vô hạn.
- Rào cản (học phí, bận, sợ không đạt) ghi vào `concerns`, không ghi đè điểm yếu khách đã chọn.
- Các bước chính: mục tiêu -> trình độ -> deadline -> lịch -> hình thức học -> rào cản -> lộ trình.

## Performance / UX
- Chatbot lazy-load sau khi main page interactive.
- Tin nhắn người dùng xuất hiện ngay; AI dùng streaming response.
- Stream được buffer và update theo `requestAnimationFrame`, không render từng token trực tiếp.
- Confetti dynamic import, chạy ngắn, tự unmount.
- Hỗ trợ `prefers-reduced-motion`.
- Không mở modal voucher khi AI đang trả lời hoặc người dùng đang gõ.
- Giữ nguyên state hội thoại khi modal mở/đóng.
- Voucher claim phải idempotent phía backend.