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
@Schema(description = "Verify OTP and login request payload")
public class VerifyOtpRequest {

    @NotBlank(message = "Identifier is required")
    @Schema(description = "Student Campus handle, email, or phone", example = "alex_campus", requiredMode = Schema.RequiredMode.REQUIRED)
    private String identifier;

    @NotBlank(message = "OTP code is required")
    @Schema(description = "6-digit OTP code", example = "481923", requiredMode = Schema.RequiredMode.REQUIRED)
    private String otp;
}
