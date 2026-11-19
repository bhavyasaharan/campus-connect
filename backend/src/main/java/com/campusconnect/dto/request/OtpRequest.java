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
@Schema(description = "OTP login request payload")
public class OtpRequest {

    @NotBlank(message = "Identifier (handle, email, or phone) is required")
    @Schema(description = "Student Campus handle, email, or phone", example = "alex_campus", requiredMode = Schema.RequiredMode.REQUIRED)
    private String identifier;
}
