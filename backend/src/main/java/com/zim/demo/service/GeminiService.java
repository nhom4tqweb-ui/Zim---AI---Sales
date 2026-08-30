package com.zim.demo.service;

import com.zim.demo.config.SystemPromptProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Chiu trach nhiem goi Gemini API. Controller chi goi service nay,
 * khong tu xu ly logic goi API truc tiep (dung chuan tach lop Controller/Service).
 */
@Service
public class GeminiService {

    private final WebClient webClient;
    private final SystemPromptProvider systemPromptProvider;

    @Value("${gemini.api.key}")
    private String apiKey;

    // Model khuyen nghi cho free tier: gemini-2.5-flash hoac gemini-2.5-flash-lite
    // (gemini-2.5-pro gioi han rat thap tren free tier, de bi loi 429 khi demo).
    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    public GeminiService(SystemPromptProvider systemPromptProvider) {
        this.systemPromptProvider = systemPromptProvider;
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public String askGemini(String userMessage) {
        String endpoint = String.format("/v1beta/models/%s:generateContent?key=%s", model, apiKey);

        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemPromptProvider.getSystemPrompt()))
                ),
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", userMessage))
                        )
                )
        );

        Map<String, Object> response = webClient.post()
                .uri(endpoint)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorResume(err -> Mono.error(new RuntimeException("Loi goi Gemini API: " + err.getMessage())))
                .block();

        return extractReplyText(response);
    }

    @SuppressWarnings("unchecked")
    private String extractReplyText(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Xin loi, toi chua co cau tra loi phu hop.";
        }
    }
}
