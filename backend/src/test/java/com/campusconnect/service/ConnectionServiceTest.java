package com.campusconnect.service;

import com.campusconnect.dto.request.PassUserRequest;
import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import com.campusconnect.service.impl.ConnectionServiceImpl;
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
class ConnectionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConnectRequestRepository requestRepository;

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private UserPassRepository passRepository;

    @Mock
    private UserBlockRepository blockRepository;

    @Mock
    private com.campusconnect.websocket.ChatMessagePublisher chatMessagePublisher;

    @InjectMocks
    private ConnectionServiceImpl connectionService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = User.builder()
                .id(1L)
                .handle("alex_rivers")
                .displayName("Alex Rivers")
                .accountStatus(AccountStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        user2 = User.builder()
                .id(2L)
                .handle("sophia_chen")
                .displayName("Sophia Chen")
                .accountStatus(AccountStatus.ACTIVE)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();
    }

    @Test
    @DisplayName("Send Connect Request successfully creates PENDING request")
    void testSendConnectRequest_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(blockRepository.isBlockedBetween(user1, user2)).thenReturn(false);
        when(connectionRepository.findBetweenUsers(user1, user2)).thenReturn(Optional.empty());
        when(requestRepository.findBySenderAndReceiver(user1, user2)).thenReturn(Optional.empty());
        when(passRepository.findByUserAndPassedUser(user1, user2)).thenReturn(Optional.empty());

        ConnectRequest savedRequest = ConnectRequest.builder()
                .id(101L)
                .sender(user1)
                .receiver(user2)
                .note("Hey Sophia! Let's connect.")
                .status(ConnectRequest.RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(requestRepository.save(any(ConnectRequest.class))).thenReturn(savedRequest);

        SendConnectRequest dto = SendConnectRequest.builder()
                .senderId(1L)
                .receiverId(2L)
                .note("Hey Sophia! Let's connect.")
                .build();

        ConnectRequestResponse response = connectionService.sendConnectRequest(dto);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(ConnectRequest.RequestStatus.PENDING, response.getStatus());
        assertEquals("Hey Sophia! Let's connect.", response.getNote());
        verify(requestRepository, times(1)).save(any(ConnectRequest.class));
    }

    @Test
    @DisplayName("Send Connect Request fails if user is blocked")
    void testSendConnectRequest_Blocked() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(blockRepository.isBlockedBetween(user1, user2)).thenReturn(true);

        SendConnectRequest dto = SendConnectRequest.builder()
                .senderId(1L)
                .receiverId(2L)
                .build();

        assertThrows(ForbiddenException.class, () -> connectionService.sendConnectRequest(dto));
        verify(requestRepository, never()).save(any());
    }

    @Test
    @DisplayName("Accepting Connect Request enforces canonical pair and seeds initial note into chat")
    void testAcceptConnectRequest_Success() {
        ConnectRequest request = ConnectRequest.builder()
                .id(101L)
                .sender(user2) // user 2 sends to user 1
                .receiver(user1)
                .note("Loved your robot in robotics club!")
                .status(ConnectRequest.RequestStatus.PENDING)
                .build();

        when(requestRepository.findById(101L)).thenReturn(Optional.of(request));
        when(blockRepository.isBlockedBetween(user2, user1)).thenReturn(false);

        Connection savedConn = Connection.builder()
                .id(501L)
                .user1(user1) // Canonical: 1 < 2
                .user2(user2)
                .originRequest(request)
                .connectedAt(LocalDateTime.now())
                .lastInteractionAt(LocalDateTime.now())
                .build();

        when(connectionRepository.save(any(Connection.class))).thenReturn(savedConn);

        ConnectionResponse response = connectionService.acceptConnectRequest(101L, 1L);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals(ConnectRequest.RequestStatus.ACCEPTED, request.getStatus());
        verify(connectionRepository, times(1)).save(any(Connection.class));
        verify(messageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("Pass User records pass entry in repository")
    void testPassUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(passRepository.findByUserAndPassedUser(user1, user2)).thenReturn(Optional.empty());

        PassUserRequest req = PassUserRequest.builder()
                .userId(1L)
                .passedUserId(2L)
                .build();

        connectionService.passUser(req);

        verify(passRepository, times(1)).save(any(UserPass.class));
    }

    @Test
    @DisplayName("Cancel sent connect request succeeds if pending")
    void testCancelConnectRequest_Success() {
        ConnectRequest req = ConnectRequest.builder()
                .id(101L)
                .sender(user1)
                .receiver(user2)
                .status(ConnectRequest.RequestStatus.PENDING)
                .build();

        when(requestRepository.findById(101L)).thenReturn(Optional.of(req));

        connectionService.cancelConnectRequest(101L, 1L);

        verify(requestRepository, times(1)).delete(req);
    }

    @Test
    @DisplayName("Remove Connection successfully dissolves connection and cleans up chat")
    void testRemoveConnection_Success() {
        Connection conn = Connection.builder()
                .id(501L)
                .user1(user1)
                .user2(user2)
                .build();

        when(connectionRepository.findById(501L)).thenReturn(Optional.of(conn));

        connectionService.removeConnection(501L, 1L);

        verify(messageRepository, times(1)).deleteByConnection(conn);
        verify(connectionRepository, times(1)).delete(conn);
    }

    @Test
    @DisplayName("Remove Connection throws ForbiddenException if user is not part of connection")
    void testRemoveConnection_Forbidden() {
        Connection conn = Connection.builder()
                .id(501L)
                .user1(user1)
                .user2(user2)
                .build();

        when(connectionRepository.findById(501L)).thenReturn(Optional.of(conn));

        assertThrows(ForbiddenException.class, () -> connectionService.removeConnection(501L, 999L));
        verify(connectionRepository, never()).delete(any());
    }
}
