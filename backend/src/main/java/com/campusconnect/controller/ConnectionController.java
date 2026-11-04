package com.campusconnect.controller;

import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
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
@Tag(name = "Connections & Messaging", description = "Endpoints for managing student connection requests, mutual acceptances, and private conversations")
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request")
    @Operation(summary = "Send a connection request", description = "Sends a connection request to another student with an optional intro note.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Connection request sent successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request or already connected")
    })
    public ResponseEntity<ApiResponse<ConnectRequestResponse>> sendRequest(
            @Valid @RequestBody SendConnectRequest request) {
        ConnectRequestResponse response = connectionService.sendConnectRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Connection request sent successfully", response));
    }

    @PostMapping("/requests/{id}/accept")
    @Operation(summary = "Accept connection request", description = "Accepts a pending request, creating a mutual connection and unlocking the private chat window.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connection accepted and chat unlocked"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Request not found")
    })
    public ResponseEntity<ApiResponse<ConnectionResponse>> acceptRequest(
            @Parameter(description = "Request ID", example = "101") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam Long currentUserId) {
        ConnectionResponse response = connectionService.acceptConnectRequest(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection accepted! Chat unlocked.", response));
    }

    @PostMapping("/requests/{id}/decline")
    @Operation(summary = "Decline connection request", description = "Declines a pending connection request.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connection request declined"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Request not found")
    })
    public ResponseEntity<ApiResponse<ConnectRequestResponse>> declineRequest(
            @Parameter(description = "Request ID", example = "101") @PathVariable Long id,
            @Parameter(description = "Current authenticated user ID", example = "1") @RequestParam Long currentUserId) {
        ConnectRequestResponse response = connectionService.declineConnectRequest(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Connection request declined", response));
    }

    @GetMapping("/requests/pending")
    @Operation(summary = "Get received pending requests", description = "Retrieves all incoming pending connect requests for a specific student.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of pending requests retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<ConnectRequestResponse>>> getPendingRequests(
            @Parameter(description = "User ID to query pending requests for", example = "1") @RequestParam Long userId) {
        List<ConnectRequestResponse> requests = connectionService.getPendingRequests(userId);
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user connections", description = "Retrieves all active mutual connections for a student.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connections list retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> getUserConnections(
            @Parameter(description = "User ID to query connections for", example = "1") @PathVariable Long userId) {
        List<ConnectionResponse> connections = connectionService.getUserConnections(userId);
        return ResponseEntity.ok(ApiResponse.ok(connections));
    }

    @GetMapping("/{connectionId}/messages")
    @Operation(summary = "Get connection chat messages", description = "Retrieves historical messages between two connected students.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Messages list retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "User is not a participant of this connection")
    })
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @Parameter(description = "Connection ID", example = "1") @PathVariable Long connectionId,
            @Parameter(description = "Requesting User ID for access control", example = "1") @RequestParam Long userId) {
        List<ChatMessageResponse> messages = connectionService.getConnectionMessages(connectionId, userId);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PostMapping("/{connectionId}/messages")
    @Operation(summary = "Send chat message", description = "Sends a new direct message within an active, unlocked connection.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Message sent successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Not allowed to send messages in this connection")
    })
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Parameter(description = "Connection ID", example = "1") @PathVariable Long connectionId,
            @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse message = connectionService.sendMessage(connectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Message sent", message));
    }
}
