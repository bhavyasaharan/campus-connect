package com.campusconnect.controller;

import com.campusconnect.dto.request.AdminLoginRequest;
import com.campusconnect.dto.request.ResolveReportRequest;
import com.campusconnect.dto.response.AdminAuthResponse;
import com.campusconnect.dto.response.AdminReportResponse;
import com.campusconnect.dto.response.AdminUserManagementResponse;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AuthSessionLogResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.AdminUser;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.service.AdminAuthService;
import com.campusconnect.service.AuthSessionLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Administrator Management & Auth", description = "Dedicated admin portal authentication, user moderation, and session logs")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final AuthSessionLogService authSessionLogService;

    @PostMapping("/auth/login")
    @Operation(summary = "Admin login", description = "Authenticates administrator with username/email and password, returning an admin JWT token.")
    public ResponseEntity<ApiResponse<AdminAuthResponse>> login(@Valid @RequestBody AdminLoginRequest request) {
        AdminAuthResponse response = adminAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Admin authenticated successfully", response));
    }

    @GetMapping("/auth/me")
    @Operation(summary = "Get current admin profile", description = "Returns profile of authenticated administrator.")
    public ResponseEntity<ApiResponse<AdminAuthResponse.AdminDetails>> getCurrentAdmin(Authentication authentication) {
        AdminUser admin = getAuthenticatedAdmin(authentication);
        AdminAuthResponse.AdminDetails profile = adminAuthService.getAdminProfile(admin.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/users")
    @Operation(summary = "Get all campus users for moderation", description = "Returns full list of registered campus students for admin management.")
    public ResponseEntity<ApiResponse<List<AdminUserManagementResponse>>> getAllUsers(Authentication authentication) {
        verifyAdminAccess(authentication);
        List<AdminUserManagementResponse> users = adminAuthService.getAllCampusUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/users/{userId}/suspend")
    @Operation(summary = "Suspend student account", description = "Suspends a student account due to policy violations.")
    public ResponseEntity<ApiResponse<Void>> suspendUser(
            Authentication authentication,
            @Parameter(description = "Student User ID", example = "1") @PathVariable Long userId) {
        verifyAdminAccess(authentication);
        adminAuthService.toggleUserSuspension(userId, true);
        return ResponseEntity.ok(ApiResponse.ok("User suspended successfully", null));
    }

    @PostMapping("/users/{userId}/activate")
    @Operation(summary = "Reactivate student account", description = "Restores an active status for a suspended student account.")
    public ResponseEntity<ApiResponse<Void>> activateUser(
            Authentication authentication,
            @Parameter(description = "Student User ID", example = "1") @PathVariable Long userId) {
        verifyAdminAccess(authentication);
        adminAuthService.toggleUserSuspension(userId, false);
        return ResponseEntity.ok(ApiResponse.ok("User account reactivated successfully", null));
    }

    @PostMapping("/auth/logout")
    @Operation(summary = "Admin logout", description = "Logs out administrator and records the logout session activity event.")
    public ResponseEntity<ApiResponse<String>> logout(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AdminUser adminUser) {
            adminAuthService.logout(adminUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.ok("Administrator logged out successfully", "SUCCESS"));
    }

    @GetMapping("/logs/auth")
    @Operation(summary = "Get Auth & Session Activity Logs", description = "Retrieves recent login and logout activity records for students and administrators.")
    public ResponseEntity<ApiResponse<List<AuthSessionLogResponse>>> getAuthSessionLogs(Authentication authentication) {
        verifyAdminAccess(authentication);
        List<AuthSessionLogResponse> logs = authSessionLogService.getRecentSessionLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/reports")
    @Operation(summary = "Get user violation reports", description = "Retrieves student reports filed by campus users, optionally filtered by status (PENDING, RESOLVED, DISMISSED).")
    public ResponseEntity<ApiResponse<List<AdminReportResponse>>> getReports(
            Authentication authentication,
            @Parameter(description = "Filter by status: PENDING, RESOLVED, DISMISSED")
            @RequestParam(required = false) ReportStatus status) {
        verifyAdminAccess(authentication);
        List<AdminReportResponse> reports = adminAuthService.getReports(status);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/reports/pending-count")
    @Operation(summary = "Get count of pending reports", description = "Returns total number of unresolved student reports requiring administrator attention.")
    public ResponseEntity<ApiResponse<Long>> getPendingReportCount(Authentication authentication) {
        verifyAdminAccess(authentication);
        long count = adminAuthService.getPendingReportCount();
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PostMapping("/reports/{reportId}/resolve")
    @Operation(summary = "Handle and resolve a report", description = "Resolves or dismisses a report, applies moderation actions such as student suspension, and records reviewer notes.")
    public ResponseEntity<ApiResponse<AdminReportResponse>> resolveReport(
            Authentication authentication,
            @Parameter(description = "Report ID", example = "1") @PathVariable Long reportId,
            @Valid @RequestBody ResolveReportRequest request) {
        AdminUser admin = getAuthenticatedAdmin(authentication);
        AdminReportResponse response = adminAuthService.resolveReport(reportId, request, admin);
        return ResponseEntity.ok(ApiResponse.ok("Report handled successfully", response));
    }

    private void verifyAdminAccess(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AdminUser)) {
            throw new ForbiddenException("Access denied: Administrator privileges required.");
        }
    }

    private AdminUser getAuthenticatedAdmin(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AdminUser adminUser) {
            return adminUser;
        }
        throw new ForbiddenException("Access denied: Administrator privileges required.");
    }
}
