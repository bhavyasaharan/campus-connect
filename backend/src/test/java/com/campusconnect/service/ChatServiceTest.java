package com.campusconnect.service;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.ChatMessage;
import com.campusconnect.model.Connection;
import com.campusconnect.model.User;
import com.campusconnect.repository.ChatMessageRepository;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.UserBlockRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.impl.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private UserBlockRepository blockRepository;

    @Mock
    private com.campusconnect.websocket.ChatMessagePublisher chatMessagePublisher;

    @InjectMocks
    private ChatServiceImpl chatService;

    private User user1;
    private User user2;
    private Connection connection;

    @BeforeEach
    void setUp() {
        user1 = User.builder().id(1L).displayName("Alex Rivers").build();
        user2 = User.builder().id(2L).displayName("Sophia Chen").build();
        connection = Connection.builder()
                .id(501L)
                .user1(user1)
                .user2(user2)
                .connectedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Send Message succeeds within mutual active connection")
    void testSendMessage_Success() {
        when(connectionRepository.findById(501L)).thenReturn(Optional.of(connection));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(blockRepository.isBlockedBetween(user1, user2)).thenReturn(false);

        ChatMessage saved = ChatMessage.builder()
                .id(901L)
                .connection(connection)
                .sender(user1)
                .content("Hey Sophia!")
                .sentAt(LocalDateTime.now())
                .build();

        when(messageRepository.save(any(ChatMessage.class))).thenReturn(saved);

        SendMessageRequest req = SendMessageRequest.builder()
                .senderId(1L)
                .content("Hey Sophia!")
                .build();

        ChatMessageResponse res = chatService.sendMessage(501L, req);

        assertNotNull(res);
        assertEquals(901L, res.getId());
        assertEquals("Hey Sophia!", res.getContent());
        verify(messageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("Send Message fails if sender is not participant in connection")
    void testSendMessage_NotParticipant() {
        User outsider = User.builder().id(99L).build();
        when(connectionRepository.findById(501L)).thenReturn(Optional.of(connection));
        when(userRepository.findById(99L)).thenReturn(Optional.of(outsider));

        SendMessageRequest req = SendMessageRequest.builder()
                .senderId(99L)
                .content("Spam message")
                .build();

        assertThrows(ForbiddenException.class, () -> chatService.sendMessage(501L, req));
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Send Message fails if participants have blocked each other")
    void testSendMessage_Blocked() {
        when(connectionRepository.findById(501L)).thenReturn(Optional.of(connection));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(blockRepository.isBlockedBetween(user1, user2)).thenReturn(true);

        SendMessageRequest req = SendMessageRequest.builder()
                .senderId(1L)
                .content("Unwanted message")
                .build();

        assertThrows(ForbiddenException.class, () -> chatService.sendMessage(501L, req));
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Mark Messages as Read updates read timestamp for conversation")
    void testMarkMessagesAsRead_Success() {
        when(connectionRepository.findById(501L)).thenReturn(Optional.of(connection));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        chatService.markMessagesAsRead(501L, 1L);

        verify(messageRepository, times(1)).markAsRead(eq(connection), eq(user1), any(LocalDateTime.class));
    }
}
