package com.campusconnect.controller;

import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.service.UserService;
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
            @Parameter(description = "Unique user ID", example = "1") @PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @GetMapping("/handle/{handle}")
    @Operation(summary = "Get student profile by handle", description = "Retrieves a student's profile by their unique campus/Instagram handle.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Student profile found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Student profile not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserByHandle(
            @Parameter(description = "Student Instagram handle (without @)", example = "sophia_chen") @PathVariable String handle) {
        UserResponse user = userService.getUserByHandle(handle);
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
}
