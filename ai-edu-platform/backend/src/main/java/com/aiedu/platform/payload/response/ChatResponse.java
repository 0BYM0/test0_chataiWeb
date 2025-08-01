package com.aiedu.platform.payload.response;

import java.time.LocalDateTime;

/**
 * 聊天响应类
 */
public class ChatResponse {
    private Long id;
    private String content;
    private String sender;
    private LocalDateTime createdAt;

    public ChatResponse(Long id, String content, String sender, LocalDateTime createdAt) {
        this.id = id;
        this.content = content;
        this.sender = sender;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * 消息数据传输对象，用于传递消息历史
     */
    public static class MessageDto {
        private String sender;
        private String content;
        private LocalDateTime timestamp;

        public MessageDto(String sender, String content, LocalDateTime timestamp) {
            this.sender = sender;
            this.content = content;
            this.timestamp = timestamp;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
}