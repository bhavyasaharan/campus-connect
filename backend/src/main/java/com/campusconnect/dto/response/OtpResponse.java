package com.campusconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "OTP generation response")
public class OtpResponse {

    @Schema(description = "Identifier that received the OTP", example = "alex_campus")
    private String identifier;

    @Schema(description = "OTP countdown expiry in seconds", example = "300")
    private int expiresInSeconds;

    @Schema(description = "Generated OTP code (provided for easy testing/sandbox demo)", example = "481923")
    private String otp;

    @Schema(description = "Informative status message", example = "OTP generated successfully.")
    private String message;
}
