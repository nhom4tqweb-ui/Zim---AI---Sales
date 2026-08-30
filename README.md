# ZIM Academy - AI Sales Funnel Demo

Khung dự án demo Landing Page ZIM Academy kết hợp AI Sales Funnel (Gemini API).
Backend viết bằng **Java Spring Boot**.

## Cấu trúc thư mục

```
zim-academy-demo/
├── frontend/                          # Giao diện (HTML/Tailwind theo Style Guide ZIM)
│   ├── index.html
│   ├── assets/                        # css, img, icons
│   ├── js/                            # chatbot.js, funnel.js, countdown.js
│   └── content/                       # Nội dung biên tập (JSON) - hero, funnel steps, pricing, objections
│
├── backend/                            # Spring Boot project (Maven)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/zim/demo/
│       │   ├── ZimDemoApplication.java        # Main class
│       │   ├── controller/ChatController.java # POST /api/chat
│       │   ├── service/GeminiService.java      # Logic gọi Gemini API
│       │   ├── config/SystemPromptProvider.java # System prompt cho AI
│       │   ├── config/CorsConfig.java           # Cho phép frontend gọi API
│       │   └── dto/                             # ChatRequest, ChatResponse
│       └── resources/
│           ├── application.properties           # Đọc GEMINI_API_KEY từ biến môi trường
│           └── application-example.properties   # File mẫu tham khảo
│
└── docs/                               # Tài liệu dự án
    ├── content-document.md
    └── CLAUDE.md
```

## Quy tắc quan trọng
- KHÔNG gọi thẳng Gemini API từ frontend (lộ API key). Mọi request AI phải đi qua backend `POST /api/chat`.
- API key đọc từ biến môi trường `GEMINI_API_KEY`, không hard-code trong `application.properties`, không commit lên Git.
- Nội dung/kịch bản do team content biên tập nằm ở `frontend/content/*.json` và `backend/.../config/SystemPromptProvider.java`.

## Chạy thử

**Yêu cầu:** Java 17+, Maven (hoặc dùng Maven Wrapper nếu có).

**Cách 1 — Set biến môi trường (khuyến khích khi làm nhóm/dùng Git):**
```bash
cd backend
export GEMINI_API_KEY=your_gemini_api_key_here      # Windows: set GEMINI_API_KEY=...
mvn spring-boot:run
```

**Cách 2 — Dùng file local riêng (tiện cho test cá nhân, không cần export lại mỗi lần):**
```bash
cd backend/src/main/resources
cp application-local.properties.example application-local.properties
# Mở application-local.properties, dán key thật vào gemini.api.key=...
cd ../../../..    # quay lại thư mục backend
mvn spring-boot:run
```
File `application-local.properties` đã được thêm vào `.gitignore` — không bao giờ bị commit lên Git dù bạn để key thật trong đó.

Backend sẽ chạy tại `http://localhost:8080`, endpoint chat tại `http://localhost:8080/api/chat`.

Mở `frontend/index.html` bằng Live Server (VD: cổng 5500) để test giao diện gọi API sang backend.

> Nếu muốn gộp 1 cổng duy nhất: copy toàn bộ nội dung `frontend/` vào
> `backend/src/main/resources/static/`, Spring Boot sẽ tự serve giao diện
> tại `http://localhost:8080` luôn, không cần CORS.
