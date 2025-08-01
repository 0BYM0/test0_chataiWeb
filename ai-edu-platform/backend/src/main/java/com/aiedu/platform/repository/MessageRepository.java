package com.aiedu.platform.repository;

import com.aiedu.platform.model.Conversation;
import com.aiedu.platform.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 消息仓库接口，用于操作消息数据
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    /**
     * 根据对话查找消息列表，按创建时间升序排序
     * @param conversation 对话
     * @return 消息列表
     */
    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);
    
    /**
     * 根据对话删除所有消息
     * @param conversation 对话
     */
    void deleteByConversation(Conversation conversation);
}