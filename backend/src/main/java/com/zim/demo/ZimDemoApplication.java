package com.zim.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Diem khoi chay ung dung backend ZIM Academy AI Sales Funnel Demo.
 * Backend nay dong vai tro proxy giua Frontend va Gemini API:
 * - Nhan request tu frontend (POST /api/chat)
 * - Ghep them system prompt dinh huong thuong hieu ZIM
 * - Goi Gemini API bang key luu an toan trong application.properties
 * - Tra ket qua ve cho frontend
 */
@SpringBootApplication
public class ZimDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZimDemoApplication.class, args);
    }
}
