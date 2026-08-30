// chatbot.js
// Xử lý widget chatbot AI Tư vấn (góc phải màn hình)
// LƯU Ý: KHÔNG gọi thẳng Gemini API tại đây. Mọi request phải đi qua backend proxy.

// Nếu chạy backend Java Spring Boot tách cổng (VD: localhost:8080) và frontend
// mở riêng bằng Live Server (VD: localhost:5500), dùng URL đầy đủ như dưới.
// Nếu đã gộp frontend vào backend/src/main/resources/static/ (cùng 1 cổng),
// chỉ cần dùng "/api/chat" là đủ.
const CHAT_API_ENDPOINT = "http://localhost:8080/api/chat";

async function sendMessageToAI(userMessage) {
  try {
    const res = await fetch(CHAT_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    if (!res.ok) throw new Error("Lỗi gọi API chat");
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("Chatbot error:", err);
    return "Xin lỗi, hiện tại trợ lý AI đang bận. Vui lòng thử lại sau.";
  }
}

// TODO: gắn sendMessageToAI vào UI widget (input, nút gửi, khung hiển thị hội thoại)
