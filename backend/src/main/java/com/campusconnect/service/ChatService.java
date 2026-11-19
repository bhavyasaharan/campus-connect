package com.campusconnect.service;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ChatMessageResponse;

import java.util.List;

public interface ChatService {
    ChatMessageResponse sendMessage(Long connectionId, SendMessageRequest requestDto);
    List<ChatMessageResponse> getConnectionMessages(Long connectionId, Long userId);
    void markMessagesAsRead(Long connectionId, Long userId);
}
