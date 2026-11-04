package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to resend a verification code for an active challenge")
public class InstagramResendRequest {

    @NotBlank(message = "Challenge ID is required")
    @Schema(description = "Unique challenge ID", example = "ch_98f7e2a1b4c3", requiredMode = Schema.RequiredMode.REQUIRED)
    private String challengeId;
}
