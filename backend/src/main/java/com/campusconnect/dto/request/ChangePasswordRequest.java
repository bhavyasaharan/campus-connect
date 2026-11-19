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
@Schema(description = "Change password request payload")
public class ChangePasswordRequest {

    @Schema(description = "Current account password (optional for accounts setting password for first time)", example = "Campus@123")
    private String currentPassword;

    @NotBlank(message = "New password cannot be blank")
    @Schema(description = "New secure password", example = "NewSecurePassword456!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String newPassword;

    @Schema(description = "Optional user ID", example = "1")
    private Long userId;
}
