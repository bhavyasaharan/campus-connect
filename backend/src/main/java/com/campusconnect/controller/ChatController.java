package com.campusconnect.controller;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.ChatService;
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
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat & Messaging", description = "Endpoints for private peer-to-peer conversations within accepted mutual connections")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/connections/{connectionId}/messages")
    @Operation(summary = "Get connection chat messages", description = "Retrieves conversation messages in chronological order between two mutually connected students.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Messages list retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "User is not a participant of this connection or blocked")
    })
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @Parameter(description = "Connection ID", example = "1") @PathVariable Long connectionId,
            @Parameter(description = "Requesting User ID for access control", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<ChatMessageResponse> messages = chatService.getConnectionMessages(connectionId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PostMapping("/connections/{connectionId}/messages")
    @Operation(summary = "Send chat message", description = "Sends a new direct message within an active, unlocked connection.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Message sent successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Messaging locked unless connection accepted")
    })
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Parameter(description = "Connection ID", example = "1") @PathVariable Long connectionId,
            @Valid @RequestBody SendMessageRequest request) {
        Long authenticatedSenderId = SecurityUtils.resolveUserId(request.getSenderId());
        request.setSenderId(authenticatedSenderId);
        ChatMessageResponse message = chatService.sendMessage(connectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Message sent", message));
    }

    @PatchMapping("/connections/{connectionId}/read")
    @Operation(summary = "Mark messages as read", description = "Marks all unread messages received in this connection as read by the current user.")
    public ResponseEntity<ApiResponse<Void>> markMessagesAsRead(
            @Parameter(description = "Connection ID", example = "1") @PathVariable Long connectionId,
            @Parameter(description = "Current User ID", example = "1") @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        chatService.markMessagesAsRead(connectionId, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Messages marked as read", null));
    }
}
