package com.aiedu.platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器
 */
@RestController
@RequestMapping("/test")
public class TestController {

    /**
     * 测试API是否正常工作
     * @return 包含状态信息的Map
     */
    @GetMapping
    public Map<String, Object> testApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "AI教育平台后端API正常工作");
        return response;
    }
}