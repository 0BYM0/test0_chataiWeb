package com.aiedu.platform.service;

import com.aiedu.platform.model.LessonPlan;
import com.aiedu.platform.payload.response.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI服务类，用于与AI服务进行交互
 */
@Service
public class AIService {
    
    @Value("${ai.service.multi-agent.url}")
    private String multiAgentServiceUrl;
    
    @Value("${ai.service.single-agent.url}")
    private String singleAgentServiceUrl;
    
    private final RestTemplate restTemplate;
    
    public AIService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * 获取多智能体系统的回复
     * @param history 对话历史
     * @param message 用户消息
     * @return AI回复
     */
    public String getMultiAgentReply(List<ChatResponse.MessageDto> history, String message) {
        int maxRetries = 3;
        int retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                // 准备请求头
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                // 准备请求体
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("history", history);
                requestBody.put("message", message);
                
                // 创建请求实体
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                
                // 记录请求信息
                System.out.println("发送请求到AI服务: " + multiAgentServiceUrl + "/chat");
                System.out.println("请求体: " + requestBody);
                
                // 发送请求
                ResponseEntity<Map> response = restTemplate.postForEntity(
                        multiAgentServiceUrl + "/chat",
                        request,
                        Map.class
                );
                
                // 解析响应
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("reply")) {
                    return (String) responseBody.get("reply");
                } else {
                    System.out.println("AI服务返回了无效的响应格式: " + responseBody);
                    return "抱歉，AI服务暂时无法回复，请稍后再试。";
                }
            } catch (Exception e) {
                retryCount++;
                System.err.println("连接AI服务时出现错误 (尝试 " + retryCount + "/" + maxRetries + "): " + e.getMessage());
                
                if (retryCount >= maxRetries) {
                    e.printStackTrace();
                    return "抱歉，连接AI服务时出现错误，请稍后再试。错误详情: " + e.getMessage();
                }
                
                // 等待一段时间后重试
                try {
                    Thread.sleep(1000 * retryCount);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        
        return "抱歉，AI服务暂时不可用，请稍后再试。";
    }
    
    /**
     * 生成教案
     * @param grade 年级
     * @param module 模块
     * @param knowledgePoint 知识点
     * @param duration 课时
     * @param preferences 教学偏好
     * @param customRequirements 自定义要求
     * @param useRAG 是否使用知识库增强
     * @return 生成的教案
     */
    public LessonPlan generateLessonPlan(String grade, String module, String knowledgePoint, 
                                         Integer duration, List<String> preferences, 
                                         String customRequirements, boolean useRAG) {
        try {
            // 准备请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // 准备请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("grade", grade);
            requestBody.put("module", module);
            requestBody.put("knowledgePoint", knowledgePoint);
            requestBody.put("duration", duration);
            requestBody.put("preferences", preferences);
            requestBody.put("customRequirements", customRequirements);
            requestBody.put("useRAG", useRAG);
            
            // 创建请求实体
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // 发送请求
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    singleAgentServiceUrl + "/generate-lesson-plan",
                    request,
                    Map.class
            );
            
            // 解析响应
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                LessonPlan lessonPlan = new LessonPlan();
                
                // 设置基本信息
                lessonPlan.setTitle((String) responseBody.get("title"));
                lessonPlan.setGrade(grade);
                lessonPlan.setModule(module);
                lessonPlan.setKnowledgePoint(knowledgePoint);
                lessonPlan.setDuration(duration);
                
                // 设置教学目标
                if (responseBody.containsKey("objectives")) {
                    lessonPlan.setObjectivesList((List<Map<String, String>>) responseBody.get("objectives"));
                }
                
                // 设置教学重点
                if (responseBody.containsKey("keyPoints")) {
                    lessonPlan.setKeyPointsList((List<String>) responseBody.get("keyPoints"));
                }
                
                // 设置教学难点
                if (responseBody.containsKey("difficultPoints")) {
                    lessonPlan.setDifficultPointsList((List<String>) responseBody.get("difficultPoints"));
                }
                
                // 设置教学资源
                if (responseBody.containsKey("resources")) {
                    lessonPlan.setResourcesList((List<Map<String, String>>) responseBody.get("resources"));
                }
                
                // 设置教学过程
                if (responseBody.containsKey("teachingProcess")) {
                    lessonPlan.setTeachingProcessList((List<Map<String, Object>>) responseBody.get("teachingProcess"));
                }
                
                // 设置教学评价
                if (responseBody.containsKey("evaluation")) {
                    lessonPlan.setEvaluation((String) responseBody.get("evaluation"));
                }
                
                // 设置拓展建议
                if (responseBody.containsKey("extension")) {
                    lessonPlan.setExtension((String) responseBody.get("extension"));
                }
                
                return lessonPlan;
            } else {
                throw new RuntimeException("AI服务返回空响应");
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("生成教案失败：" + e.getMessage());
        }
    }
}