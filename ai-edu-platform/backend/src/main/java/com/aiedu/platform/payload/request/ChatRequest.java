package com.aiedu.platform.payload.request;

import javax.validation.constraints.NotBlank;

/**
 * 聊天请求类
 */
public class ChatRequest {
    @NotBlank
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}