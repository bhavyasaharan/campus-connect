package com.campusconnect.controller;

import com.campusconnect.dto.request.InstagramChallengeRequest;
import com.campusconnect.dto.request.InstagramLoginRequest;
import com.campusconnect.dto.request.InstagramResendRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.InstagramChallengeResponse;
import com.campusconnect.dto.response.InstagramVerificationStatusResponse;
import com.campusconnect.service.InstagramAuthenticationService;
import com.campusconnect.service.InstagramVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/instagram")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication & Instagram Verification", description = "Endpoints for initiating one-time password challenges, checking verification status, resending OTPs, and JWT login")
public class InstagramAuthenticationController {

    private final InstagramVerificationService verificationService;
    private final InstagramAuthenticationService authenticationService;

    @PostMapping("/challenge")
    @Operation(summary = "Create Instagram DM challenge", description = "Generates a unique 6-digit verification code and challenge token for the claimed Instagram handle.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Challenge created successfully with OTP"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid username format")
    })
    public ResponseEntity<ApiResponse<InstagramChallengeResponse>> createChallenge(
            @Valid @RequestBody InstagramChallengeRequest request) {

        InstagramChallengeResponse response = verificationService.createChallenge(request.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Verification challenge created", response));
    }

    @PostMapping("/resend")
    @Operation(summary = "Resend verification code", description = "Refreshes the 6-digit OTP and resets the 5-minute expiry countdown for an active challenge.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "New OTP generated and active"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Challenge not found, expired, or cooldown violation")
    })
    public ResponseEntity<ApiResponse<InstagramChallengeResponse>> resendChallenge(
            @Valid @RequestBody InstagramResendRequest request) {

        InstagramChallengeResponse response = verificationService.resendOtp(request.getChallengeId());
        return ResponseEntity.ok(ApiResponse.ok("Verification code resent", response));
    }

    @GetMapping("/verification/{challengeId}")
    @Operation(summary = "Poll verification status", description = "Queries the current lifecycle status (PENDING, VERIFYING, CHECKING_ELIGIBILITY, VERIFIED, FAILED, EXPIRED) of an active challenge.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Challenge ID not found")
    })
    public ResponseEntity<ApiResponse<InstagramVerificationStatusResponse>> getStatus(
            @Parameter(description = "Unique 64-char challenge token", example = "ch_98f7e2a1b4c3") @PathVariable String challengeId) {

        InstagramVerificationStatusResponse status = verificationService.getVerificationStatus(challengeId);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange verified challenge for JWT", description = "Exchanges a VERIFIED challenge ID for an authenticated user profile and signed JWT session token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, returns JWT token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Challenge is not verified or expired")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> completeLogin(
            @Valid @RequestBody InstagramLoginRequest request) {

        AuthResponse authResponse = authenticationService.loginWithVerifiedChallenge(request.getChallengeId());
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authResponse));
    }

    @Data
    @Schema(description = "Development DM simulation payload")
    public static class DevSimulateDmRequest {
        @Schema(description = "Claimed Instagram username", example = "alex_campus")
        private String username;
        @Schema(description = "6-digit OTP code", example = "481923")
        private String otp;
        @Schema(description = "Optional Instagram Scoped User ID (IGSID)", example = "igsid_123456789")
        private String igsid;
    }

    /**
     * Safe development endpoint allowing testing of the verification and follower logic
     * before Meta Webhooks and Meta App Review are fully configured.
     */
    @PostMapping("/dev/simulate-dm")
    @Operation(summary = "Simulate incoming Instagram DM (Dev/Sandbox)", description = "Development test endpoint to simulate an incoming DM containing an OTP, validating follower checks and auto-verifying the challenge.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Simulated DM processed successfully")
    })
    public ResponseEntity<ApiResponse<String>> simulateDm(@RequestBody DevSimulateDmRequest request) {
        String igsid = request.getIgsid() != null ? request.getIgsid() : "dev_igsid_" + Math.abs(request.getUsername().hashCode());
        log.info("[DEV SIMULATE] Simulating incoming Instagram DM from @{} with OTP {}", request.getUsername(), request.getOtp());

        verificationService.processIncomingMessage(igsid, request.getUsername(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Simulated DM processed", "SUCCESS"));
    }
}
