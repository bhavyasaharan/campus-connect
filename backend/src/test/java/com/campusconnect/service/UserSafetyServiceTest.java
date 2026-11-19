package com.campusconnect.service;

import com.campusconnect.dto.request.BlockUserRequest;
import com.campusconnect.dto.request.ReportUserRequest;
import com.campusconnect.dto.request.UnblockUserRequest;
import com.campusconnect.dto.response.BlockedUserResponse;
import com.campusconnect.dto.response.ReportResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ConnectRequest;
import com.campusconnect.model.Connection;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.User;
import com.campusconnect.model.UserBlock;
import com.campusconnect.model.UserReport;
import com.campusconnect.repository.ConnectRequestRepository;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.UserBlockRepository;
import com.campusconnect.repository.UserReportRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.impl.UserSafetyServiceImpl;
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
class UserSafetyServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserBlockRepository blockRepository;

    @Mock
    private UserReportRepository reportRepository;

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ConnectRequestRepository requestRepository;

    @InjectMocks
    private UserSafetyServiceImpl safetyService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = User.builder().id(1L).handle("alex_rivers").displayName("Alex Rivers").build();
        user2 = User.builder().id(2L).handle("sophia_chen").displayName("Sophia Chen").build();
    }

    @Test
    @DisplayName("Block User saves block, dissolves connection, and declines pending requests")
    void testBlockUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(blockRepository.findByBlockerAndBlocked(user1, user2)).thenReturn(Optional.empty());

        Connection conn = Connection.builder().id(501L).user1(user1).user2(user2).build();
        when(connectionRepository.findBetweenUsers(user1, user2)).thenReturn(Optional.of(conn));

        ConnectRequest pending = ConnectRequest.builder().id(101L).sender(user1).receiver(user2).status(ConnectRequest.RequestStatus.PENDING).build();
        when(requestRepository.findAllBetweenUsers(user1, user2)).thenReturn(List.of(pending));

        BlockUserRequest req = BlockUserRequest.builder()
                .blockerId(1L)
                .blockedId(2L)
                .reason("Harassment")
                .build();

        safetyService.blockUser(req);

        verify(blockRepository, times(1)).save(any(UserBlock.class));
        verify(connectionRepository, times(1)).delete(conn);
        assertEquals(ConnectRequest.RequestStatus.DECLINED, pending.getStatus());
        verify(requestRepository, times(1)).save(pending);
    }

    @Test
    @DisplayName("Block User throws error if blocker targets themselves")
    void testBlockUser_SelfTarget() {
        BlockUserRequest req = BlockUserRequest.builder()
                .blockerId(1L)
                .blockedId(1L)
                .build();

        assertThrows(BadRequestException.class, () -> safetyService.blockUser(req));
        verify(blockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unblock User deletes block record")
    void testUnblockUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

        UserBlock block = UserBlock.builder().id(88L).blocker(user1).blocked(user2).build();
        when(blockRepository.findByBlockerAndBlocked(user1, user2)).thenReturn(Optional.of(block));

        UnblockUserRequest req = UnblockUserRequest.builder().blockerId(1L).blockedId(2L).build();
        safetyService.unblockUser(req);

        verify(blockRepository, times(1)).delete(block);
    }

    @Test
    @DisplayName("Report User saves policy report for campus safety audit")
    void testReportUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

        UserReport saved = UserReport.builder()
                .id(999L)
                .reporter(user1)
                .reported(user2)
                .reason("INAPPROPRIATE_CONTENT")
                .details("Inappropriate messages")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(reportRepository.save(any(UserReport.class))).thenReturn(saved);

        ReportUserRequest req = ReportUserRequest.builder()
                .reporterId(1L)
                .reportedId(2L)
                .reason("INAPPROPRIATE_CONTENT")
                .details("Inappropriate messages")
                .build();

        ReportResponse res = safetyService.reportUser(req);

        assertNotNull(res);
        assertEquals(999L, res.getId());
        assertEquals("INAPPROPRIATE_CONTENT", res.getReason());
        assertEquals(ReportStatus.PENDING, res.getStatus());
        verify(reportRepository, times(1)).save(any(UserReport.class));
    }
}
