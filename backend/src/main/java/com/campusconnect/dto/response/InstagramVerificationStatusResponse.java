package com.campusconnect.dto.response;

import com.campusconnect.model.ChallengeStatus;
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
@Schema(description = "Polling status response for Instagram verification challenge")
public class InstagramVerificationStatusResponse {

    @Schema(description = "Challenge identifier token", example = "ch_98f7e2a1b4c3")
    private String challengeId;

    @Schema(description = "Current lifecycle status: PENDING, VERIFYING, CHECKING_ELIGIBILITY, VERIFIED, FAILED, EXPIRED, MAX_ATTEMPTS_EXCEEDED", example = "VERIFIED")
    private ChallengeStatus status;

    @Schema(description = "Whether the user successfully verified as a follower", example = "true")
    private boolean verified;

    @Schema(description = "Failure or error reason if verification failed")
    private String failureReason;

    @Schema(description = "JWT Bearer token if verification is completed (allows immediate auto-login)")
    private String jwtToken;

    @Schema(description = "Authenticated student profile data if verified")
    private UserResponse user;

    @Schema(description = "Expiration timestamp of the challenge")
    private LocalDateTime expiresAt;

    @Schema(description = "Meta API limitation or dev mode notice if applicable")
    private String limitationNotice;
}
