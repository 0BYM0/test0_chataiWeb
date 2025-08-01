package com.aiedu.platform.controller;

import com.aiedu.platform.model.Conversation;
import com.aiedu.platform.model.Message;
import com.aiedu.platform.model.User;
import com.aiedu.platform.payload.request.ChatRequest;
import com.aiedu.platform.payload.response.ChatResponse;
import com.aiedu.platform.payload.response.ConversationResponse;
import com.aiedu.platform.payload.response.MessageResponse;
import com.aiedu.platform.repository.ConversationRepository;
import com.aiedu.platform.repository.MessageRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 对话控制器，处理学生与多智能体系统的交互
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIService aiService;

    /**
     * 获取当前用户的所有对话
     * @return 对话列表响应
     */
    @GetMapping("/conversations")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getConversations() {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取用户的所有对话
        List<Conversation> conversations = conversationRepository.findByUserOrderByUpdatedAtDesc(user);
        
        // 转换为响应对象
        List<ConversationResponse> conversationResponses = conversations.stream()
                .map(conversation -> new ConversationResponse(
                        conversation.getId(),
                        conversation.getTitle(),
                        conversation.getCreatedAt(),
                        conversation.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(conversationResponses);
    }

    /**
     * 创建新对话
     * @param title 对话标题
     * @return 对话响应
     */
    @PostMapping("/conversations")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> createConversation(@RequestParam String title) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 创建新对话
        Conversation conversation = new Conversation();
        conversation.setTitle(title);
        conversation.setUser(user);
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        
        conversationRepository.save(conversation);

        // 返回创建的对话
        ConversationResponse response = new ConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 获取对话的所有消息
     * @param conversationId 对话ID
     * @return 消息列表
     */
    @GetMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMessages(@PathVariable Long conversationId) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取对话
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        // 验证对话所有者
        if (!conversation.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权访问此对话"));
        }

        // 获取对话的所有消息
        List<Message> messages = messageRepository.findByConversationOrderByCreatedAtAsc(conversation);

        return ResponseEntity.ok(messages);
    }

    /**
     * 发送消息并获取AI回复
     * @param conversationId 对话ID
     * @param chatRequest 聊天请求
     * @return 聊天响应
     */
    @PostMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendMessage(@PathVariable Long conversationId, @Valid @RequestBody ChatRequest chatRequest) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取对话
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        // 验证对话所有者
        if (!conversation.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权访问此对话"));
        }

        // 保存用户消息
        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setContent(chatRequest.getContent());
        userMessage.setSender("user");
        userMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(userMessage);

        // 更新对话时间
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // 获取对话历史
        List<Message> messageHistory = messageRepository.findByConversationOrderByCreatedAtAsc(conversation);
        List<ChatResponse.MessageDto> history = messageHistory.stream()
                .map(message -> new ChatResponse.MessageDto(
                        message.getSender(),
                        message.getContent(),
                        message.getCreatedAt()
                ))
                .collect(Collectors.toList());

        // 调用AI服务获取回复
        String aiReply = aiService.getMultiAgentReply(history, chatRequest.getContent());

        // 保存AI回复
        Message aiMessage = new Message();
        aiMessage.setConversation(conversation);
        aiMessage.setContent(aiReply);
        aiMessage.setSender("ai");
        aiMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(aiMessage);

        // 更新对话时间
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // 返回AI回复
        ChatResponse response = new ChatResponse(
                aiMessage.getId(),
                aiMessage.getContent(),
                aiMessage.getSender(),
                aiMessage.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 删除对话
     * @param conversationId 对话ID
     * @return 消息响应
     */
    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteConversation(@PathVariable Long conversationId) {
        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("用户不存在"));

        // 获取对话
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        // 验证对话所有者
        if (!conversation.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("无权删除此对话"));
        }

        // 删除对话的所有消息
        messageRepository.deleteByConversation(conversation);

        // 删除对话
        conversationRepository.delete(conversation);

        return ResponseEntity.ok(new MessageResponse("对话已删除"));
    }
}