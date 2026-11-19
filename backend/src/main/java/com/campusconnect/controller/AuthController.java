package com.campusconnect.controller;

import com.campusconnect.dto.request.ChangePasswordRequest;
import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.OtpRequest;
import com.campusconnect.dto.request.VerifyOtpRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.OtpResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Student account authentication via ID/Password and One-Time Passwords (OTP)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate with ID & Password", description = "Authenticates an existing campus student with Campus ID/Handle and password, returning a JWT access token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid credentials or account not verified")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/login/otp/request")
    @Operation(summary = "Request Login OTP", description = "Generates and sends a 6-digit login OTP code to the registered student handle, email, or phone.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP generated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Account not found")
    })
    public ResponseEntity<ApiResponse<OtpResponse>> requestLoginOtp(@Valid @RequestBody OtpRequest request) {
        OtpResponse response = authService.requestLoginOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("OTP sent successfully", response));
    }

    @PostMapping("/login/otp/verify")
    @Operation(summary = "Verify OTP & Log In", description = "Verifies the 6-digit login OTP code and returns an authenticated JWT session.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP verified and login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired OTP")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> verifyLoginOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyLoginOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("OTP login successful", response));
    }

    @PutMapping("/password")
    @Operation(summary = "Change student password", description = "Updates the account password for an authenticated student.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid password data")
    })
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        Long userId = SecurityUtils.resolveUserId(request.getUserId());
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.<String>error("User not authenticated"));
        }
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", "SUCCESS"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Student Logout", description = "Logs out the student and records the logout session event in auth_session_logs.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logged out successfully")
    })
    public ResponseEntity<ApiResponse<String>> logout(
            @RequestParam(required = false) Long userId
    ) {
        Long resolvedUserId = SecurityUtils.resolveUserId(userId);
        authService.logout(resolvedUserId);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", "SUCCESS"));
    }
}
