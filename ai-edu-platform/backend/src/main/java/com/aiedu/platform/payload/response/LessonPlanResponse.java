package com.aiedu.platform.payload.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 教案响应类
 */
public class LessonPlanResponse {
    private Long id;
    private String title;
    private String grade;
    private String module;
    private String knowledgePoint;
    private Integer duration;
    private List<Map<String, String>> objectives;
    private List<String> keyPoints;
    private List<String> difficultPoints;
    private List<Map<String, String>> resources;
    private List<Map<String, Object>> teachingProcess;
    private String evaluation;
    private String extension;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LessonPlanResponse(Long id, String title, String grade, String module, String knowledgePoint,
                             Integer duration, List<Map<String, String>> objectives, List<String> keyPoints,
                             List<String> difficultPoints, List<Map<String, String>> resources,
                             List<Map<String, Object>> teachingProcess, String evaluation, String extension,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.grade = grade;
        this.module = module;
        this.knowledgePoint = knowledgePoint;
        this.duration = duration;
        this.objectives = objectives;
        this.keyPoints = keyPoints;
        this.difficultPoints = difficultPoints;
        this.resources = resources;
        this.teachingProcess = teachingProcess;
        this.evaluation = evaluation;
        this.extension = extension;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getKnowledgePoint() {
        return knowledgePoint;
    }

    public void setKnowledgePoint(String knowledgePoint) {
        this.knowledgePoint = knowledgePoint;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public List<Map<String, String>> getObjectives() {
        return objectives;
    }

    public void setObjectives(List<Map<String, String>> objectives) {
        this.objectives = objectives;
    }

    public List<String> getKeyPoints() {
        return keyPoints;
    }

    public void setKeyPoints(List<String> keyPoints) {
        this.keyPoints = keyPoints;
    }

    public List<String> getDifficultPoints() {
        return difficultPoints;
    }

    public void setDifficultPoints(List<String> difficultPoints) {
        this.difficultPoints = difficultPoints;
    }

    public List<Map<String, String>> getResources() {
        return resources;
    }

    public void setResources(List<Map<String, String>> resources) {
        this.resources = resources;
    }

    public List<Map<String, Object>> getTeachingProcess() {
        return teachingProcess;
    }

    public void setTeachingProcess(List<Map<String, Object>> teachingProcess) {
        this.teachingProcess = teachingProcess;
    }

    public String getEvaluation() {
        return evaluation;
    }

    public void setEvaluation(String evaluation) {
        this.evaluation = evaluation;
    }

    public String getExtension() {
        return extension;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}