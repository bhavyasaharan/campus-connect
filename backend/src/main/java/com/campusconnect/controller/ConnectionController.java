package com.campusconnect.controller;

import com.campusconnect.dto.request.PassUserRequest;
import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.ConnectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
@Tag(name = "Connections & Discovery", description = "Endpoints for managing student connection requests, mutual acceptances, and discovery candidates")
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request")
    @Operation(summary = "Send a connection request (Connect)", description = "Sends a connection request to another student with an optional intro note.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Connection request sent successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request or already connected/blocked")
    })
    public ResponseEntity<ApiResponse<ConnectRequestResponse>> sendRequest(
            @Valid @RequestBody SendConnectRequest request) {
        Long authenticatedSenderId = SecurityUtils.resolveUserId(request.getSenderId());
        request.setSenderId(authenticatedSenderId);
        ConnectRequestResponse response = connectionService.sendConnectRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Connection request sent successfully", response));
    }

    @PostMapping("/pass")
    @Operation(summary = "Pass on a candidate (Pass)", description = "Passes on a candidate profile in Discovery so they are not shown in future candidate searches.")
    public ResponseEntity<ApiResponse<Void>> passUser(
            @Valid @RequestBody PassUserRequest request) {
        Long authenticatedUserId = SecurityUtils.resolveUserId(request.getUserId());
        request.setUserId(authenticatedUserId);
        connectionService.passUser(request);
        return ResponseEntity.ok(ApiResponse.ok("Profile passed successfully", null));
    }

    @PostMapping("/passes/reset")
    @Operation(summary = "Reset passed profiles", description = "Clears pass history so previously passed profiles reappear in Discovery.")
    public ResponseEntity<ApiResponse<Void>> resetPasses(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        connectionService.resetPasses(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Pass history reset successfully", null));
    }

    @GetMapping("/candidates")
    @Operation(summary = "Get Discovery candidates", description = "Retrieves student profiles eligible for Connect / Pass, excluding self, existing connections, pending requests, passed, and blocked profiles.")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getDiscoveryCandidates(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId,
            @Parameter(description = "Include passed profiles", example = "false") @RequestParam(defaultValue = "false") boolean includePassed) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<UserResponse> candidates = connectionService.getDiscoveryCandidates(currentUserId, includePassed);
        return ResponseEntity.ok(ApiResponse.ok(candidates));
    }

    @PostMapping("/requests/{id}/accept")
    @Operation(summary = "Accept connection request", description = "Accepts a pending request, creating a mutual connection and unlocking the private chat conversation.")
    public ResponseEntity<ApiResponse<ConnectionResponse>> acceptRequest(
            @Parameter(description = "Request ID", example = "101") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam(required = false) Long currentUserId) {
        Long authUserId = SecurityUtils.resolveUserId(currentUserId);
        ConnectionResponse response = connectionService.acceptConnectRequest(id, authUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection accepted! Chat unlocked.", response));
    }

    @PostMapping("/requests/{id}/decline")
    @Operation(summary = "Decline connection request", description = "Declines a pending connection request.")
    public ResponseEntity<ApiResponse<ConnectRequestResponse>> declineRequest(
            @Parameter(description = "Request ID", example = "101") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam(required = false) Long currentUserId) {
        Long authUserId = SecurityUtils.resolveUserId(currentUserId);
        ConnectRequestResponse response = connectionService.declineConnectRequest(id, authUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection request declined", response));
    }

    @DeleteMapping("/requests/{id}/cancel")
    @Operation(summary = "Cancel sent connection request", description = "Cancels an outgoing pending connection request sent by current user.")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @Parameter(description = "Request ID", example = "101") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam(required = false) Long currentUserId) {
        Long authUserId = SecurityUtils.resolveUserId(currentUserId);
        connectionService.cancelConnectRequest(id, authUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection request cancelled", null));
    }

    @GetMapping("/requests/pending")
    @Operation(summary = "Get received pending requests", description = "Retrieves incoming pending connect requests for a student.")
    public ResponseEntity<ApiResponse<List<ConnectRequestResponse>>> getPendingRequests(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<ConnectRequestResponse> requests = connectionService.getPendingRequests(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    @GetMapping("/requests/received")
    @Operation(summary = "Get received pending requests (alias)", description = "Retrieves incoming pending connect requests for a student.")
    public ResponseEntity<ApiResponse<List<ConnectRequestResponse>>> getReceivedRequests(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<ConnectRequestResponse> requests = connectionService.getPendingRequests(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    @GetMapping("/requests/sent")
    @Operation(summary = "Get sent pending requests", description = "Retrieves outgoing pending connect requests sent by a student.")
    public ResponseEntity<ApiResponse<List<ConnectRequestResponse>>> getSentRequests(
            @Parameter(description = "User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<ConnectRequestResponse> requests = connectionService.getSentRequests(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    @GetMapping({"", "/user/{userId}"})
    @Operation(summary = "Get user connections", description = "Retrieves all active mutual connections for a student.")
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> getUserConnections(
            @Parameter(description = "User ID", example = "1") @PathVariable(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<ConnectionResponse> connections = connectionService.getUserConnections(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(connections));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove connection", description = "Removes an active mutual connection between the current user and another student.")
    public ResponseEntity<ApiResponse<Void>> removeConnection(
            @Parameter(description = "Connection ID", example = "10") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam(required = false) Long currentUserId) {
        Long authUserId = SecurityUtils.resolveUserId(currentUserId);
        connectionService.removeConnection(id, authUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection removed successfully", null));
    }

    @DeleteMapping("/user/{targetUserId}")
    @Operation(summary = "Remove connection by target user", description = "Removes an active mutual connection between current user and target user.")
    public ResponseEntity<ApiResponse<Void>> removeConnectionWithUser(
            @Parameter(description = "Target user ID", example = "2") @PathVariable Long targetUserId,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam(required = false) Long currentUserId) {
        Long authUserId = SecurityUtils.resolveUserId(currentUserId);
        connectionService.removeConnectionWithUser(authUserId, targetUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection removed successfully", null));
    }
}
