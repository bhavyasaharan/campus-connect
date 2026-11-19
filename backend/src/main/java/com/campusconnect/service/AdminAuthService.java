package com.campusconnect.service;

import com.campusconnect.dto.request.AdminLoginRequest;
import com.campusconnect.dto.request.ResolveReportRequest;
import com.campusconnect.dto.response.AdminAuthResponse;
import com.campusconnect.dto.response.AdminReportResponse;
import com.campusconnect.dto.response.AdminUserManagementResponse;
import com.campusconnect.model.AdminUser;
import com.campusconnect.model.ReportStatus;

import java.util.List;

public interface AdminAuthService {

    AdminAuthResponse login(AdminLoginRequest request);

    AdminAuthResponse.AdminDetails getAdminProfile(Long adminId);

    List<AdminUserManagementResponse> getAllCampusUsers();

    void toggleUserSuspension(Long userId, boolean suspend);

    void logout(Long adminId);

    List<AdminReportResponse> getReports(ReportStatus status);

    AdminReportResponse resolveReport(Long reportId, ResolveReportRequest request, AdminUser admin);

    long getPendingReportCount();
}
