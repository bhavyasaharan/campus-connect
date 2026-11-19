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
@Schema(description = "ID and Password login request payload")
public class LoginRequest {

    @NotBlank(message = "Campus ID, handle, or email is required")
    @Schema(description = "Student Campus handle, email, phone, or ID", example = "alex_campus", requiredMode = Schema.RequiredMode.REQUIRED)
    private String identifier;

    @NotBlank(message = "Password is required")
    @Schema(description = "Account password", example = "Campus@123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
