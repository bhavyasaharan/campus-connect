package com.campusconnect.controller;

import com.campusconnect.dto.request.BlockUserRequest;
import com.campusconnect.dto.request.ReportUserRequest;
import com.campusconnect.dto.request.UnblockUserRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.BlockedUserResponse;
import com.campusconnect.dto.response.ReportResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.UserSafetyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/safety")
@RequiredArgsConstructor
@Tag(name = "Trust & Safety", description = "Endpoints for student protection, blocking abusive profiles, and submitting policy violation reports")
public class UserSafetyController {

    private final UserSafetyService safetyService;

    @PostMapping("/block")
    @Operation(summary = "Block a student", description = "Blocks another student, dissolving mutual connection and preventing chat or requests.")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @Valid @RequestBody BlockUserRequest request) {
        Long authenticatedBlockerId = SecurityUtils.resolveUserId(request.getBlockerId());
        request.setBlockerId(authenticatedBlockerId);
        safetyService.blockUser(request);
        return ResponseEntity.ok(ApiResponse.ok("User blocked successfully", null));
    }

    @PostMapping("/unblock")
    @Operation(summary = "Unblock a student", description = "Unblocks a previously blocked student.")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @Valid @RequestBody UnblockUserRequest request) {
        Long authenticatedBlockerId = SecurityUtils.resolveUserId(request.getBlockerId());
        request.setBlockerId(authenticatedBlockerId);
        safetyService.unblockUser(request);
        return ResponseEntity.ok(ApiResponse.ok("User unblocked successfully", null));
    }

    @GetMapping("/blocked")
    @Operation(summary = "Get blocked users", description = "Retrieves all students currently blocked by this user.")
    public ResponseEntity<ApiResponse<List<BlockedUserResponse>>> getBlockedUsers(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<BlockedUserResponse> blocked = safetyService.getBlockedUsers(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(blocked));
    }

    @PostMapping("/report")
    @Operation(summary = "Report a student", description = "Submits a user violation report for campus moderation.")
    public ResponseEntity<ApiResponse<ReportResponse>> reportUser(
            @Valid @RequestBody ReportUserRequest request) {
        Long authenticatedReporterId = SecurityUtils.resolveUserId(request.getReporterId());
        request.setReporterId(authenticatedReporterId);
        ReportResponse response = safetyService.reportUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User report received. Thank you for keeping campus safe.", response));
    }
}
