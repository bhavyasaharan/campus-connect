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
@Schema(description = "Authentication response with JWT token and user profile")
public class AuthResponse {

    @Schema(description = "Signed JWT Bearer access token", example = "eyJhbGciOiJIUzUxMiJ9...")
    private String token;

    @Schema(description = "Authenticated student profile")
    private UserResponse user;

    @Schema(description = "Indicates if the user was just registered during this verification flow", example = "false")
    private boolean isNewUser;
}
