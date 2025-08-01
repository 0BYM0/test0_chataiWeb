package com.aiedu.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * AI教育平台后端应用程序入口类
 */
@SpringBootApplication
public class AIEduPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(AIEduPlatformApplication.class, args);
    }
    
    /**
     * 配置CORS跨域请求
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                            "http://localhost:5173", // 本地开发服务器
                            "https://cloud1-0g0mbccz12f37fb3-1354189051.tcloudbaseapp.com", // 云环境地址
                            "*" // 允许所有来源（生产环境应该更严格）
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}