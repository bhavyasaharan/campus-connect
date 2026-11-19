package com.campusconnect.service;

import com.campusconnect.dto.request.AdminLoginRequest;
import com.campusconnect.dto.request.ResolveReportRequest;
import com.campusconnect.dto.response.AdminAuthResponse;
import com.campusconnect.dto.response.AdminReportResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.AdminRole;
import com.campusconnect.model.AdminUser;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.User;
import com.campusconnect.model.UserReport;
import com.campusconnect.model.UserType;
import com.campusconnect.repository.AdminUserRepository;
import com.campusconnect.repository.StudentProfileRepository;
import com.campusconnect.repository.UserReportRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.impl.AdminAuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthSessionLogService authSessionLogService;

    @Mock
    private UserReportRepository reportRepository;

    @InjectMocks
    private AdminAuthServiceImpl adminAuthService;

    private AdminUser testAdmin;
    private User reporter;
    private User reported;
    private UserReport testReport;

    @BeforeEach
    void setUp() {
        testAdmin = AdminUser.builder()
                .id(1L)
                .username("campus_admin")
                .email("admin@campusconnect.edu")
                .passwordHash("encoded_pw")
                .fullName("System Administrator")
                .role(AdminRole.SUPER_ADMIN)
                .active(true)
                .build();

        reporter = User.builder()
                .id(10L)
                .handle("reporter_student")
                .displayName("Good Student")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        reported = User.builder()
                .id(20L)
                .handle("abusive_student")
                .displayName("Bad Student")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        testReport = UserReport.builder()
                .id(100L)
                .reporter(reporter)
                .reported(reported)
                .reason("HARASSMENT")
                .details("Sent harassing chat messages")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Admin Login succeeds with valid credentials")
    void testLogin_Success() {
        AdminLoginRequest req = AdminLoginRequest.builder()
                .identifier("campus_admin")
                .password("Admin@123")
                .build();

        when(adminUserRepository.findByIdentifier("campus_admin")).thenReturn(Optional.of(testAdmin));
        when(passwordEncoder.matches("Admin@123", "encoded_pw")).thenReturn(true);
        when(jwtService.generateAdminToken(1L, "campus_admin", AdminRole.SUPER_ADMIN)).thenReturn("mock.admin.jwt");

        AdminAuthResponse res = adminAuthService.login(req);

        assertNotNull(res);
        assertEquals("mock.admin.jwt", res.getToken());
        assertEquals("campus_admin", res.getAdmin().getUsername());
        assertEquals(AdminRole.SUPER_ADMIN, res.getAdmin().getRole());
        verify(authSessionLogService, times(1)).recordLogin(UserType.ADMIN, 1L, "campus_admin", "ADMIN_PASSWORD");
    }

    @Test
    @DisplayName("Admin Login fails when account is deactivated")
    void testLogin_DeactivatedThrowsForbidden() {
        testAdmin.setActive(false);
        AdminLoginRequest req = AdminLoginRequest.builder()
                .identifier("campus_admin")
                .password("Admin@123")
                .build();

        when(adminUserRepository.findByIdentifier("campus_admin")).thenReturn(Optional.of(testAdmin));

        assertThrows(ForbiddenException.class, () -> adminAuthService.login(req));
    }

    @Test
    @DisplayName("Admin Login fails with invalid password")
    void testLogin_WrongPasswordThrowsBadRequest() {
        AdminLoginRequest req = AdminLoginRequest.builder()
                .identifier("campus_admin")
                .password("WrongPass")
                .build();

        when(adminUserRepository.findByIdentifier("campus_admin")).thenReturn(Optional.of(testAdmin));
        when(passwordEncoder.matches("WrongPass", "encoded_pw")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> adminAuthService.login(req));
    }

    @Test
    @DisplayName("Get Reports returns all reports when status is null")
    void testGetReports_All() {
        when(reportRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(testReport));

        List<AdminReportResponse> reports = adminAuthService.getReports(null);

        assertEquals(1, reports.size());
        assertEquals("HARASSMENT", reports.get(0).getReason());
        assertEquals("reporter_student", reports.get(0).getReporterHandle());
        assertEquals("abusive_student", reports.get(0).getReportedUserHandle());
        assertEquals(ReportStatus.PENDING, reports.get(0).getStatus());
    }

    @Test
    @DisplayName("Get Reports filtered by PENDING status")
    void testGetReports_FilteredByStatus() {
        when(reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING)).thenReturn(List.of(testReport));

        List<AdminReportResponse> reports = adminAuthService.getReports(ReportStatus.PENDING);

        assertEquals(1, reports.size());
        assertEquals(ReportStatus.PENDING, reports.get(0).getStatus());
    }

    @Test
    @DisplayName("Get Pending Report Count returns accurate count")
    void testGetPendingReportCount() {
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(5L);

        long count = adminAuthService.getPendingReportCount();

        assertEquals(5L, count);
    }

    @Test
    @DisplayName("Resolve Report with SUSPEND_USER suspends reported student and marks report as RESOLVED")
    void testResolveReport_SuspendUser() {
        when(reportRepository.findById(100L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(UserReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResolveReportRequest req = ResolveReportRequest.builder()
                .action("SUSPEND_USER")
                .reviewerNotes("Violated student conduct policy with harassment")
                .suspendReportedUser(true)
                .build();

        AdminReportResponse res = adminAuthService.resolveReport(100L, req, testAdmin);

        assertNotNull(res);
        assertEquals(ReportStatus.RESOLVED, res.getStatus());
        assertEquals("SUSPEND_USER", res.getActionTaken());
        assertEquals("Violated student conduct policy with harassment", res.getReviewerNotes());
        assertNotNull(res.getResolvedAt());
        assertEquals(AccountStatus.SUSPENDED, reported.getAccountStatus());
        verify(userRepository, times(1)).save(reported);
        verify(reportRepository, times(1)).save(testReport);
    }

    @Test
    @DisplayName("Resolve Report with DISMISSED does not suspend user and marks report as DISMISSED")
    void testResolveReport_Dismissed() {
        when(reportRepository.findById(100L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(UserReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResolveReportRequest req = ResolveReportRequest.builder()
                .action("DISMISSED")
                .reviewerNotes("No violation found upon review")
                .suspendReportedUser(false)
                .build();

        AdminReportResponse res = adminAuthService.resolveReport(100L, req, testAdmin);

        assertNotNull(res);
        assertEquals(ReportStatus.DISMISSED, res.getStatus());
        assertEquals("DISMISSED", res.getActionTaken());
        assertEquals(AccountStatus.ACTIVE, reported.getAccountStatus());
        verify(userRepository, never()).save(reported);
        verify(reportRepository, times(1)).save(testReport);
    }
}
