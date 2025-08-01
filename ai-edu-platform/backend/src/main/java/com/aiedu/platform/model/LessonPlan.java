package com.aiedu.platform.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 教案实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lesson_plans")
public class LessonPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "grade")
    private String grade;
    
    @Column(name = "module")
    private String module;
    
    @Column(name = "knowledge_point")
    private String knowledgePoint;
    
    @Column(name = "duration")
    private Integer duration;
    
    @Column(name = "objectives", columnDefinition = "TEXT")
    private String objectives;
    
    @Transient
    private List<Map<String, String>> objectivesList;
    
    @Column(name = "key_points", columnDefinition = "TEXT")
    private String keyPoints;
    
    @Transient
    private List<String> keyPointsList;
    
    @Column(name = "difficult_points", columnDefinition = "TEXT")
    private String difficultPoints;
    
    @Transient
    private List<String> difficultPointsList;
    
    @Column(name = "resources", columnDefinition = "TEXT")
    private String resources;
    
    @Transient
    private List<Map<String, String>> resourcesList;
    
    @Column(name = "teaching_process", columnDefinition = "TEXT")
    private String teachingProcess;
    
    @Transient
    private List<Map<String, Object>> teachingProcessList;
    
    @Column(name = "evaluation", columnDefinition = "TEXT")
    private String evaluation;
    
    @Column(name = "extension", columnDefinition = "TEXT")
    private String extension;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 获取教学目标列表
     * @return 教学目标列表
     */
    public List<Map<String, String>> getObjectivesList() {
        if (objectives == null || objectives.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(objectives, new TypeReference<List<Map<String, String>>>() {});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 设置教学目标列表
     * @param objectivesList 教学目标列表
     */
    public void setObjectivesList(List<Map<String, String>> objectivesList) {
        try {
            this.objectives = objectMapper.writeValueAsString(objectivesList);
            this.objectivesList = objectivesList;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 获取教学重点列表
     * @return 教学重点列表
     */
    public List<String> getKeyPointsList() {
        if (keyPoints == null || keyPoints.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(keyPoints, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 设置教学重点列表
     * @param keyPointsList 教学重点列表
     */
    public void setKeyPointsList(List<String> keyPointsList) {
        try {
            this.keyPoints = objectMapper.writeValueAsString(keyPointsList);
            this.keyPointsList = keyPointsList;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 获取教学难点列表
     * @return 教学难点列表
     */
    public List<String> getDifficultPointsList() {
        if (difficultPoints == null || difficultPoints.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(difficultPoints, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 设置教学难点列表
     * @param difficultPointsList 教学难点列表
     */
    public void setDifficultPointsList(List<String> difficultPointsList) {
        try {
            this.difficultPoints = objectMapper.writeValueAsString(difficultPointsList);
            this.difficultPointsList = difficultPointsList;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 获取教学资源列表
     * @return 教学资源列表
     */
    public List<Map<String, String>> getResourcesList() {
        if (resources == null || resources.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(resources, new TypeReference<List<Map<String, String>>>() {});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 设置教学资源列表
     * @param resourcesList 教学资源列表
     */
    public void setResourcesList(List<Map<String, String>> resourcesList) {
        try {
            this.resources = objectMapper.writeValueAsString(resourcesList);
            this.resourcesList = resourcesList;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 获取教学过程列表
     * @return 教学过程列表
     */
    public List<Map<String, Object>> getTeachingProcessList() {
        if (teachingProcess == null || teachingProcess.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            return objectMapper.readValue(teachingProcess, new TypeReference<List<Map<String, Object>>>() {});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    /**
     * 设置教学过程列表
     * @param teachingProcessList 教学过程列表
     */
    public void setTeachingProcessList(List<Map<String, Object>> teachingProcessList) {
        try {
            this.teachingProcess = objectMapper.writeValueAsString(teachingProcessList);
            this.teachingProcessList = teachingProcessList;
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
}