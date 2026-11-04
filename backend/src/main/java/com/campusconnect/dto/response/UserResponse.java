package com.campusconnect.dto.response;

import com.campusconnect.model.User;
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
@Schema(description = "Student profile representation")
public class UserResponse {

    @Schema(description = "Unique user ID", example = "1")
    private Long id;

    @Schema(description = "Instagram / Campus handle", example = "sophia_chen")
    private String handle;

    @Schema(description = "Display name", example = "Sophia Chen")
    private String displayName;

    @Schema(description = "Academic major / department", example = "Cognitive Science & Design")
    private String department;

    @Schema(description = "Graduation class / year", example = "Senior 2025")
    private String graduationYear;

    @Schema(description = "Personal biography", example = "Figma enthusiast, analog film shooter, ambient synthwave.")
    private String bio;

    @Schema(description = "Profile avatar image URL", example = "https://images.unsplash.com/photo-1517841905240-472988babdf9")
    private String avatarUrl;

    @Schema(description = "Social follower verification status (VERIFIED, GRACE_PERIOD, RESTRICTED)", example = "VERIFIED")
    private VerificationStatus verificationStatus;

    @Schema(description = "Timestamp when 24h grace period expires")
    private LocalDateTime gracePeriodExpiresAt;

    @Schema(description = "Timestamp when last verified against official Instagram followers")
    private LocalDateTime lastVerifiedAt;

    @Schema(description = "Timestamp when student registered")
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .handle(user.getHandle())
                .displayName(user.getDisplayName())
                .department(user.getDepartment())
                .graduationYear(user.getGraduationYear())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .verificationStatus(user.getVerificationStatus())
                .gracePeriodExpiresAt(user.getGracePeriodExpiresAt())
                .lastVerifiedAt(user.getLastVerifiedAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
