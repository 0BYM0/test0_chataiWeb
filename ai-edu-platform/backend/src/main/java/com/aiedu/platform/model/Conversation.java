package com.aiedu.platform.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 对话实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "conversations")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "conversation_type")
    private String conversationType;
    
    @Column(name = "title")
    private String title;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "agent_roles_involved")
    private String agentRolesInvolved;
    
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 添加消息到对话
     * @param message 消息对象
     */
    public void addMessage(Message message) {
        messages.add(message);
        message.setConversation(this);
    }
    
    /**
     * 移除消息
     * @param message 消息对象
     */
    public void removeMessage(Message message) {
        messages.remove(message);
        message.setConversation(null);
    }
}