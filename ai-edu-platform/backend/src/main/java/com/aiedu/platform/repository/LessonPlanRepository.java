package com.aiedu.platform.repository;

import com.aiedu.platform.model.LessonPlan;
import com.aiedu.platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 教案仓库接口，用于操作教案数据
 */
@Repository
public interface LessonPlanRepository extends JpaRepository<LessonPlan, Long> {
    /**
     * 根据用户查找教案列表，按创建时间降序排序
     * @param user 用户
     * @return 教案列表
     */
    List<LessonPlan> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * 根据用户和标题查找教案
     * @param user 用户
     * @param title 标题
     * @return 教案对象
     */
    LessonPlan findByUserAndTitle(User user, String title);
    
    /**
     * 根据用户和年级查找教案列表
     * @param user 用户
     * @param grade 年级
     * @return 教案列表
     */
    List<LessonPlan> findByUserAndGradeOrderByCreatedAtDesc(User user, String grade);
    
    /**
     * 根据用户和模块查找教案列表
     * @param user 用户
     * @param module 模块
     * @return 教案列表
     */
    List<LessonPlan> findByUserAndModuleOrderByCreatedAtDesc(User user, String module);
}