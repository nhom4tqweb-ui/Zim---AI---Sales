package com.zim.demo.controller;

import com.zim.demo.dto.ChatRequest;
import com.zim.demo.dto.ChatResponse;
import com.zim.demo.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Nhan request tu frontend (widget chatbot, AI Sales Funnel) va tra ve
 * cau tra loi da qua AI xu ly. Day la endpoint duy nhat frontend duoc phep goi,
 * KHONG duoc goi thang Gemini API tu trinh duyet.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        try {
            String reply = geminiService.askGemini(request.getMessage());
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ChatResponse("Xin loi, hien tai tro ly AI dang ban. Vui long thu lai sau."));
        }
    }
}
