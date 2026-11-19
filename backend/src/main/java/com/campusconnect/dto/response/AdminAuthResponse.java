package com.campusconnect.dto.response;

import com.campusconnect.model.AdminRole;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Admin authentication response payload")
public class AdminAuthResponse {

    @Schema(description = "JWT Bearer token for admin API authorization")
    private String token;

    @Schema(description = "Admin profile details")
    private AdminDetails admin;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Admin user details")
    public static class AdminDetails {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private AdminRole role;
    }
}
