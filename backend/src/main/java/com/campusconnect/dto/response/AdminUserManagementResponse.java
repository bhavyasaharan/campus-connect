package com.campusconnect.dto.response;

import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.VerificationStatus;
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
@Schema(description = "User overview for admin management")
public class AdminUserManagementResponse {

    private Long id;
    private String handle;
    private String displayName;
    private String email;
    private String college;
    private String course;
    private VerificationStatus verificationStatus;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
    private LocalDateTime lastVerifiedAt;
}
