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
@Schema(description = "Admin login request payload")
public class AdminLoginRequest {

    @NotBlank(message = "Username or email is required")
    @Schema(description = "Admin username or email", example = "campus_admin")
    private String identifier;

    @NotBlank(message = "Password is required")
    @Schema(description = "Admin password", example = "Admin@123")
    private String password;
}
