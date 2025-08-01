package com.aiedu.platform.repository;

import com.aiedu.platform.model.Conversation;
import com.aiedu.platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 对话仓库接口，用于操作对话数据
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    /**
     * 根据用户查找对话列表
     * @param user 用户
     * @return 对话列表
     */
    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);
    
    /**
     * 根据用户和标题查找对话
     * @param user 用户
     * @param title 标题
     * @return 对话对象
     */
    Conversation findByUserAndTitle(User user, String title);
}