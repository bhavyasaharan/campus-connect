package com.campusconnect.controller;

import com.campusconnect.dto.request.CreateUserPostRequest;
import com.campusconnect.dto.request.UpdateUserPostRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.UserPostResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.UserPostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "User Posts", description = "Endpoints for managing student personal profile posts (strictly separate from memes)")
public class UserPostController {

    private final UserPostService userPostService;

    @PostMapping
    @Operation(summary = "Create a user post", description = "Publishes a student post on the user's profile with multiple photos/videos and caption.")
    public ResponseEntity<ApiResponse<UserPostResponse>> createPost(
            @Valid @RequestBody CreateUserPostRequest request) {
        Long currentUserId = SecurityUtils.resolveUserId(request.getAuthorId());
        UserPostResponse response = userPostService.createPost(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a user post", description = "Updates caption and media items for an existing student profile post.")
    public ResponseEntity<ApiResponse<UserPostResponse>> updatePost(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            @Valid @RequestBody UpdateUserPostRequest request,
            Authentication authentication) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        UserPostResponse updated = userPostService.updatePost(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Post updated successfully", updated));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user posts", description = "Retrieves all posts belonging to a specific student's profile if connected or owner.")
    public ResponseEntity<ApiResponse<List<UserPostResponse>>> getUserPosts(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Optional viewer ID") @RequestParam(required = false) Long viewerId,
            Authentication authentication) {
        Long resolvedViewerId = viewerId != null ? viewerId : SecurityUtils.getUserId(authentication);
        List<UserPostResponse> posts = userPostService.getUserPosts(userId, resolvedViewerId);
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Like / Unlike a user post", description = "Toggles like reaction for a user post. 1 user can only like a post once.")
    public ResponseEntity<ApiResponse<UserPostResponse>> likePost(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            Authentication authentication) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        UserPostResponse updated = userPostService.likePost(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user post", description = "Deletes a post from the student's profile.")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        userPostService.deletePost(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Post deleted successfully", null));
    }
}
