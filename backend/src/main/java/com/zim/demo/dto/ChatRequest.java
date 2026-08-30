package com.zim.demo.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Du lieu request tu frontend gui len khi nguoi dung nhan tin cho AI Tu van.
 */
public class ChatRequest {

    @NotBlank(message = "Noi dung tin nhan khong duoc de trong")
    private String message;

    public ChatRequest() {
    }

    public ChatRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
