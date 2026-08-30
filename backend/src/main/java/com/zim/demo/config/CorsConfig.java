package com.zim.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cau hinh CORS de frontend (chay o cong/domain khac luc dev, vi du Live Server
 * cong 5500) co the goi duoc API o backend (mac dinh cong 8080).
 *
 * Neu gop frontend vao serve chung trong src/main/resources/static/
 * (cung 1 cong) thi khong bat buoc phai co file nay, nhung de lai van an toan.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5500", "http://127.0.0.1:5500")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}
