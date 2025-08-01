package com.aiedu.platform.controller;

import com.aiedu.platform.model.LessonPlan;
import com.aiedu.platform.model.User;
import com.aiedu.platform.payload.request.LessonPlanRequest;
import com.aiedu.platform.payload.response.LessonPlanResponse;
import com.aiedu.platform.payload.response.MessageResponse;
import com.aiedu.platform.repository.LessonPlanRepository;
import com.aiedu.platform.repository.UserRepository;
import com.aiedu.platform.security.services.UserDetailsImpl;
import com.aiedu.platform.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 教案控制器，处理教师与单智能体系统的交互
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/lesson-plans")
public class LessonPlanController {
    @Autowired
    private LessonPlanRepository lessonPlanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIService aiService;

    /**
     * 获取当前用户的所有教案
     * @return 教案列表响应
     */
    @GetMapping
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getLessonPlans() {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取用户的所有教案
        List<LessonPlan> lessonPlans = lessonPlanRepository.findByUserOrderByCreatedAtDesc(user);
        
        // 转换为响应对象
        List<LessonPlanResponse> lessonPlanResponses = lessonPlans.stream()
                .map(lessonPlan -> new LessonPlanResponse(
                        lessonPlan.getId(),
                        lessonPlan.getTitle(),
                        lessonPlan.getGrade(),
                        lessonPlan.getModule(),
                        lessonPlan.getKnowledgePoint(),
                        lessonPlan.getDuration(),
                        lessonPlan.getObjectivesList(),
                        lessonPlan.getKeyPointsList(),
                        lessonPlan.getDifficultPointsList(),
                        lessonPlan.getResourcesList(),
                        lessonPlan.getTeachingProcessList(),
                        lessonPlan.getEvaluation(),
                        lessonPlan.getExtension(),
                        lessonPlan.getCreatedAt(),
                        lessonPlan.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(lessonPlanResponses);
    }

    /**
     * 根据ID获取教案
     * @param id 教案ID
     * @return 教案响应
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getLessonPlanById(@PathVariable Long id) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取教案
        LessonPlan lessonPlan = lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("教案不存在"));

        // 验证教案所有者
        if (!lessonPlan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权访问此教案"));
        }

        // 转换为响应对象
        LessonPlanResponse response = new LessonPlanResponse(
                lessonPlan.getId(),
                lessonPlan.getTitle(),
                lessonPlan.getGrade(),
                lessonPlan.getModule(),
                lessonPlan.getKnowledgePoint(),
                lessonPlan.getDuration(),
                lessonPlan.getObjectivesList(),
                lessonPlan.getKeyPointsList(),
                lessonPlan.getDifficultPointsList(),
                lessonPlan.getResourcesList(),
                lessonPlan.getTeachingProcessList(),
                lessonPlan.getEvaluation(),
                lessonPlan.getExtension(),
                lessonPlan.getCreatedAt(),
                lessonPlan.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 生成教案
     * @param lessonPlanRequest 教案请求
     * @return 教案响应
     */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> generateLessonPlan(@Valid @RequestBody LessonPlanRequest lessonPlanRequest) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 调用AI服务生成教案
        LessonPlan generatedPlan = aiService.generateLessonPlan(
                lessonPlanRequest.getGrade(),
                lessonPlanRequest.getModule(),
                lessonPlanRequest.getKnowledgePoint(),
                lessonPlanRequest.getDuration(),
                lessonPlanRequest.getPreferences(),
                lessonPlanRequest.getCustomRequirements(),
                lessonPlanRequest.isUseRAG()
        );

        // 设置教案所有者和时间
        generatedPlan.setUser(user);
        generatedPlan.setCreatedAt(LocalDateTime.now());
        generatedPlan.setUpdatedAt(LocalDateTime.now());

        // 转换为响应对象
        LessonPlanResponse response = new LessonPlanResponse(
                null, // 未保存，所以ID为空
                generatedPlan.getTitle(),
                generatedPlan.getGrade(),
                generatedPlan.getModule(),
                generatedPlan.getKnowledgePoint(),
                generatedPlan.getDuration(),
                generatedPlan.getObjectivesList(),
                generatedPlan.getKeyPointsList(),
                generatedPlan.getDifficultPointsList(),
                generatedPlan.getResourcesList(),
                generatedPlan.getTeachingProcessList(),
                generatedPlan.getEvaluation(),
                generatedPlan.getExtension(),
                generatedPlan.getCreatedAt(),
                generatedPlan.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 保存教案
     * @param lessonPlanRequest 教案请求
     * @return 教案响应
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> saveLessonPlan(@Valid @RequestBody LessonPlanRequest lessonPlanRequest) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 创建新教案
        LessonPlan lessonPlan = new LessonPlan();
        lessonPlan.setTitle(lessonPlanRequest.getTitle());
        lessonPlan.setGrade(lessonPlanRequest.getGrade());
        lessonPlan.setModule(lessonPlanRequest.getModule());
        lessonPlan.setKnowledgePoint(lessonPlanRequest.getKnowledgePoint());
        lessonPlan.setDuration(lessonPlanRequest.getDuration());
        lessonPlan.setObjectivesList(lessonPlanRequest.getObjectives());
        lessonPlan.setKeyPointsList(lessonPlanRequest.getKeyPoints());
        lessonPlan.setDifficultPointsList(lessonPlanRequest.getDifficultPoints());
        lessonPlan.setResourcesList(lessonPlanRequest.getResources());
        lessonPlan.setTeachingProcessList(lessonPlanRequest.getTeachingProcess());
        lessonPlan.setEvaluation(lessonPlanRequest.getEvaluation());
        lessonPlan.setExtension(lessonPlanRequest.getExtension());
        lessonPlan.setUser(user);
        lessonPlan.setCreatedAt(LocalDateTime.now());
        lessonPlan.setUpdatedAt(LocalDateTime.now());
        
        lessonPlanRepository.save(lessonPlan);

        // 转换为响应对象
        LessonPlanResponse response = new LessonPlanResponse(
                lessonPlan.getId(),
                lessonPlan.getTitle(),
                lessonPlan.getGrade(),
                lessonPlan.getModule(),
                lessonPlan.getKnowledgePoint(),
                lessonPlan.getDuration(),
                lessonPlan.getObjectivesList(),
                lessonPlan.getKeyPointsList(),
                lessonPlan.getDifficultPointsList(),
                lessonPlan.getResourcesList(),
                lessonPlan.getTeachingProcessList(),
                lessonPlan.getEvaluation(),
                lessonPlan.getExtension(),
                lessonPlan.getCreatedAt(),
                lessonPlan.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 更新教案
     * @param id 教案ID
     * @param lessonPlanRequest 教案请求
     * @return 教案响应
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateLessonPlan(@PathVariable Long id, @Valid @RequestBody LessonPlanRequest lessonPlanRequest) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取教案
        LessonPlan lessonPlan = lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("教案不存在"));

        // 验证教案所有者
        if (!lessonPlan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权修改此教案"));
        }

        // 更新教案
        lessonPlan.setTitle(lessonPlanRequest.getTitle());
        lessonPlan.setGrade(lessonPlanRequest.getGrade());
        lessonPlan.setModule(lessonPlanRequest.getModule());
        lessonPlan.setKnowledgePoint(lessonPlanRequest.getKnowledgePoint());
        lessonPlan.setDuration(lessonPlanRequest.getDuration());
        lessonPlan.setObjectivesList(lessonPlanRequest.getObjectives());
        lessonPlan.setKeyPointsList(lessonPlanRequest.getKeyPoints());
        lessonPlan.setDifficultPointsList(lessonPlanRequest.getDifficultPoints());
        lessonPlan.setResourcesList(lessonPlanRequest.getResources());
        lessonPlan.setTeachingProcessList(lessonPlanRequest.getTeachingProcess());
        lessonPlan.setEvaluation(lessonPlanRequest.getEvaluation());
        lessonPlan.setExtension(lessonPlanRequest.getExtension());
        lessonPlan.setUpdatedAt(LocalDateTime.now());
        
        lessonPlanRepository.save(lessonPlan);

        // 转换为响应对象
        LessonPlanResponse response = new LessonPlanResponse(
                lessonPlan.getId(),
                lessonPlan.getTitle(),
                lessonPlan.getGrade(),
                lessonPlan.getModule(),
                lessonPlan.getKnowledgePoint(),
                lessonPlan.getDuration(),
                lessonPlan.getObjectivesList(),
                lessonPlan.getKeyPointsList(),
                lessonPlan.getDifficultPointsList(),
                lessonPlan.getResourcesList(),
                lessonPlan.getTeachingProcessList(),
                lessonPlan.getEvaluation(),
                lessonPlan.getExtension(),
                lessonPlan.getCreatedAt(),
                lessonPlan.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 删除教案
     * @param id 教案ID
     * @return 消息响应
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteLessonPlan(@PathVariable Long id) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取教案
        LessonPlan lessonPlan = lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("教案不存在"));

        // 验证教案所有者
        if (!lessonPlan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权删除此教案"));
        }

        // 删除教案
        lessonPlanRepository.delete(lessonPlan);

        return ResponseEntity.ok(new MessageResponse("教案已删除"));
    }
}