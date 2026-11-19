package com.campusconnect.service.impl;

import com.campusconnect.dto.request.AdminLoginRequest;
import com.campusconnect.dto.request.ResolveReportRequest;
import com.campusconnect.dto.response.AdminAuthResponse;
import com.campusconnect.dto.response.AdminReportResponse;
import com.campusconnect.dto.response.AdminUserManagementResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.AdminRole;
import com.campusconnect.model.AdminUser;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.UserReport;
import com.campusconnect.model.UserType;
import com.campusconnect.repository.AdminUserRepository;
import com.campusconnect.repository.StudentProfileRepository;
import com.campusconnect.repository.UserReportRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.AdminAuthService;
import com.campusconnect.service.AuthSessionLogService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthSessionLogService authSessionLogService;
    private final UserReportRepository reportRepository;

    @PostConstruct
    public void initDefaultAdmin() {
        if (adminUserRepository.count() == 0) {
            AdminUser defaultAdmin = AdminUser.builder()
                    .username("campus_admin")
                    .email("admin@campusconnect.edu")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .fullName("Orbitly Administrator")
                    .role(AdminRole.SUPER_ADMIN)
                    .active(true)
                    .build();
            adminUserRepository.save(defaultAdmin);
            log.info("Initialized default administrator: @campus_admin");
        }
    }

    @Override
    @Transactional
    public AdminAuthResponse login(AdminLoginRequest request) {
        String identifier = request.getIdentifier().trim();
        AdminUser admin = adminUserRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new BadRequestException("Invalid administrator credentials."));

        if (!admin.isActive()) {
            throw new ForbiddenException("This administrator account has been deactivated.");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new BadRequestException("Invalid administrator credentials.");
        }

        admin.setLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(admin);

        String token = jwtService.generateAdminToken(admin.getId(), admin.getUsername(), admin.getRole());

        authSessionLogService.recordLogin(UserType.ADMIN, admin.getId(), admin.getUsername(), "ADMIN_PASSWORD");
        log.info("[ADMIN LOGIN] Administrator @{} logged in successfully", admin.getUsername());

        AdminAuthResponse.AdminDetails details = AdminAuthResponse.AdminDetails.builder()
                .id(admin.getId())
                .username(admin.getUsername())
                .email(admin.getEmail())
                .fullName(admin.getFullName())
                .role(admin.getRole())
                .build();

        return AdminAuthResponse.builder()
                .token(token)
                .admin(details)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAuthResponse.AdminDetails getAdminProfile(Long adminId) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator not found with id: " + adminId));

        return AdminAuthResponse.AdminDetails.builder()
                .id(admin.getId())
                .username(admin.getUsername())
                .email(admin.getEmail())
                .fullName(admin.getFullName())
                .role(admin.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserManagementResponse> getAllCampusUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    StudentProfile profile = studentProfileRepository.findByUser(u).orElse(null);
                    String college = profile != null && profile.getCollege() != null ? profile.getCollege() : "Campus University";
                    String course = profile != null && profile.getCourse() != null ? profile.getCourse() : "General Studies";

                    return AdminUserManagementResponse.builder()
                            .id(u.getId())
                            .handle(u.getHandle())
                            .displayName(u.getDisplayName())
                            .email(u.getEmail())
                            .college(college)
                            .course(course)
                            .verificationStatus(u.getVerificationStatus())
                            .accountStatus(u.getAccountStatus())
                            .createdAt(u.getCreatedAt())
                            .lastVerifiedAt(u.getLastVerifiedAt())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public void toggleUserSuspension(Long userId, boolean suspend) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student user not found with id: " + userId));

        user.setAccountStatus(suspend ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE);
        userRepository.save(user);
        log.info("Administrator updated account status for user @{} to: {}", user.getHandle(), user.getAccountStatus());
    }

    @Override
    @Transactional
    public void logout(Long adminId) {
        if (adminId == null) {
            return;
        }
        adminUserRepository.findById(adminId).ifPresent(admin -> {
            authSessionLogService.recordLogout(UserType.ADMIN, admin.getId(), admin.getUsername());
            log.info("[ADMIN LOGOUT] Administrator @{} (id={}) logged out", admin.getUsername(), admin.getId());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminReportResponse> getReports(ReportStatus status) {
        List<UserReport> reports;
        if (status == null) {
            reports = reportRepository.findAllByOrderByCreatedAtDesc();
        } else {
            reports = reportRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return reports.stream()
                .map(AdminReportResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingReportCount() {
        return reportRepository.countByStatus(ReportStatus.PENDING);
    }

    @Override
    @Transactional
    public AdminReportResponse resolveReport(Long reportId, ResolveReportRequest request, AdminUser admin) {
        UserReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : "RESOLVE_NO_ACTION";
        ReportStatus newStatus;
        if ("DISMISSED".equalsIgnoreCase(action) || "DISMISS".equalsIgnoreCase(action)) {
            newStatus = ReportStatus.DISMISSED;
        } else {
            newStatus = ReportStatus.RESOLVED;
        }

        report.setStatus(newStatus);
        report.setActionTaken(action);
        report.setReviewerNotes(request.getReviewerNotes() != null ? request.getReviewerNotes().trim() : null);
        report.setResolvedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(request.getSuspendReportedUser()) || "SUSPEND_USER".equalsIgnoreCase(action)) {
            User reported = report.getReported();
            if (reported != null) {
                reported.setAccountStatus(AccountStatus.SUSPENDED);
                userRepository.save(reported);
                log.info("Administrator @{} suspended reported user @{} (report id={})",
                        admin != null ? admin.getUsername() : "system", reported.getHandle(), reportId);
            }
        }

        UserReport saved = reportRepository.save(report);
        log.info("Administrator @{} resolved report id={} with status={} and action={}",
                admin != null ? admin.getUsername() : "system", reportId, newStatus, action);

        return AdminReportResponse.fromEntity(saved);
    }
}
