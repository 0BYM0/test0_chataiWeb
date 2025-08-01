package com.aiedu.platform.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 消息实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "sender")
    private String sender;  // 'user' 或 'ai'
    
    @Column(name = "sender_type")
    private String senderType;  // 'user' 或 'agent'
    
    @Column(name = "sender_role")
    private String senderRole;  // 用户角色或智能体角色
    
    @Column(name = "receiver_type")
    private String receiverType;  // 'user' 或 'agent'
    
    @Column(name = "receiver_role")
    private String receiverRole;  // 用户角色或智能体角色
    
    @Column(name = "timestamp")
    private LocalDateTime timestamp;
    
    @Column(name = "message_order")
    private Integer messageOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
