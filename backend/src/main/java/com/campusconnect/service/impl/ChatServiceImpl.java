package com.campusconnect.service.impl;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ChatMessage;
import com.campusconnect.model.Connection;
import com.campusconnect.model.User;
import com.campusconnect.repository.ChatMessageRepository;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.UserBlockRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.ChatService;
import com.campusconnect.websocket.ChatMessagePublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository messageRepository;
    private final UserBlockRepository blockRepository;
    private final ChatMessagePublisher chatMessagePublisher;

    /**
     * Core Rule: Messaging unlocked strictly after mutual connection is accepted.
     */
    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long connectionId, SendMessageRequest requestDto) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        User sender = userRepository.findById(requestDto.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + requestDto.getSenderId()));

        if (sender.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. Messaging is disabled.");
        }

        boolean isParticipant = connection.getUser1().getId().equals(requestDto.getSenderId()) ||
                                connection.getUser2().getId().equals(requestDto.getSenderId());

        if (!isParticipant) {
            throw new ForbiddenException("You are not part of this connection. Messaging is locked.");
        }

        if (blockRepository.isBlockedBetween(connection.getUser1(), connection.getUser2())) {
            throw new ForbiddenException("Messaging is locked because communication between these profiles is blocked.");
        }

        ChatMessage message = ChatMessage.builder()
                .connection(connection)
                .sender(sender)
                .content(requestDto.getContent().trim())
                .build();

        connection.setLastInteractionAt(LocalDateTime.now());
        connectionRepository.save(connection);

        ChatMessage saved = messageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved);
        if (chatMessagePublisher != null) {
            chatMessagePublisher.publishDirectMessage(connection, response);
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getConnectionMessages(Long connectionId, Long userId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        boolean isParticipant = connection.getUser1().getId().equals(userId) ||
                                connection.getUser2().getId().equals(userId);

        if (!isParticipant) {
            throw new ForbiddenException("Unauthorized access to connection conversation.");
        }

        if (blockRepository.isBlockedBetween(connection.getUser1(), connection.getUser2())) {
            throw new ForbiddenException("Conversation is unavailable because one of the participants is blocked.");
        }

        return messageRepository.findByConnectionOrderBySentAtAsc(connection)
                .stream()
                .map(ChatMessageResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public void markMessagesAsRead(Long connectionId, Long userId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isParticipant = connection.getUser1().getId().equals(userId) ||
                                connection.getUser2().getId().equals(userId);

        if (!isParticipant) {
            throw new ForbiddenException("Unauthorized access to connection conversation.");
        }

        messageRepository.markAsRead(connection, user, LocalDateTime.now());
        if (chatMessagePublisher != null) {
            chatMessagePublisher.publishReadReceipt(connectionId, userId);
        }
    }
}
