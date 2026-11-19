package com.campusconnect.controller;

import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.request.UpdateUserProfileRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Student profiles, directory search, and registration endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all campus students", description = "Retrieves the list of all registered student profiles in the campus directory.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "List of student profiles retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student profile by ID", description = "Retrieves a single student's profile by their unique database ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Student profile found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Student profile not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "Unique user ID", example = "1") @PathVariable Long id,
            @Parameter(description = "Optional viewer user ID for connection-aware access") @RequestParam(required = false) Long viewerId,
            Authentication authentication) {
        Long resolvedViewerId = viewerId != null ? viewerId : SecurityUtils.getUserId(authentication);
        UserResponse user = userService.getUserById(id, resolvedViewerId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @GetMapping("/handle/{handle}")
    @Operation(summary = "Get student profile by handle", description = "Retrieves a student's profile by their unique campus/Instagram handle.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Student profile found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Student profile not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserByHandle(
            @Parameter(description = "Student Instagram handle (without @)", example = "sophia_chen") @PathVariable String handle,
            @Parameter(description = "Optional viewer user ID for connection-aware access") @RequestParam(required = false) Long viewerId,
            Authentication authentication) {
        Long resolvedViewerId = viewerId != null ? viewerId : SecurityUtils.getUserId(authentication);
        UserResponse user = userService.getUserByHandle(handle, resolvedViewerId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new student account", description = "Creates a new student account and places them in an initial 24-hour verification grace period.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Student account created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or duplicate handle")
    })
    public ResponseEntity<ApiResponse<UserResponse>> registerUser(
            @Valid @RequestBody RegisterUserRequest request) {
        UserResponse created = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully with 24-hr grace period", created));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated student profile", description = "Retrieves current student's own profile resolved from JWT authentication.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Student profile found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        Long currentUserId = SecurityUtils.getUserId(authentication);
        UserResponse user = userService.getUserById(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping({"/profile", "/me"})
    @Operation(summary = "Update student profile", description = "Updates student profile details for the authenticated user extracted via JWT authentication.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Account is suspended")
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserProfileRequest request,
            Authentication authentication) {
        Long authenticatedUserId = SecurityUtils.getUserId(authentication);
        UserResponse updated = userService.updateUserProfile(authenticatedUserId, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
