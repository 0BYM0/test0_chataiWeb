package com.aiedu.platform.payload.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 教案请求类
 */
public class LessonPlanRequest {
    private String title;
    
    @NotBlank
    private String grade;
    
    @NotBlank
    private String module;
    
    @NotBlank
    private String knowledgePoint;
    
    @NotNull
    private Integer duration;
    
    private List<String> preferences;
    
    private String customRequirements;
    
    private boolean useRAG;
    
    private List<Map<String, String>> objectives;
    
    private List<String> keyPoints;
    
    private List<String> difficultPoints;
    
    private List<Map<String, String>> resources;
    
    private List<Map<String, Object>> teachingProcess;
    
    private String evaluation;
    
    private String extension;

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

    public List<String> getPreferences() {
        return preferences;
    }

    public void setPreferences(List<String> preferences) {
        this.preferences = preferences;
    }

    public String getCustomRequirements() {
        return customRequirements;
    }

    public void setCustomRequirements(String customRequirements) {
        this.customRequirements = customRequirements;
    }

    public boolean isUseRAG() {
        return useRAG;
    }

    public void setUseRAG(boolean useRAG) {
        this.useRAG = useRAG;
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
}