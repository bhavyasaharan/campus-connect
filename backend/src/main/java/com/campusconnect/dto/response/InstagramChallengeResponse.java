package com.campusconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response containing Instagram DM challenge details and instructions")
public class InstagramChallengeResponse {

    @Schema(description = "Unique challenge identifier token", example = "ch_98f7e2a1b4c3")
    private String challengeId;

    @Schema(description = "One-time 6-digit verification code to send via Instagram DM", example = "592814")
    private String otp;

    @Schema(description = "Username claimed for verification", example = "sophia_chen")
    private String claimedUsername;

    @Schema(description = "Timestamp when the 6-digit OTP expires (5 minutes from creation)")
    private LocalDateTime expiresAt;

    @Schema(description = "Timestamp when OTP resend becomes available (60s cooldown)")
    private LocalDateTime resendAvailableAt;

    @Schema(description = "Official Instagram community account handle to send the DM to", example = "campus_connect_official")
    private String communityAccount;

    @Schema(description = "Step-by-step instructions for user", example = "Send this 6-digit code to @campus_connect_official via Instagram DM to complete verification.")
    private String instructions;
}
