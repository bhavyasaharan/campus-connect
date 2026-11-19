package com.campusconnect.dto.response;

import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Lightweight public author summary for posts and memes (without private user details)")
public class AuthorSummaryResponse {

    @Schema(description = "Author user ID", example = "1")
    private Long id;

    @Schema(description = "Instagram / Campus handle", example = "sophia_chen")
    private String handle;

    @Schema(description = "Display name", example = "Sophia Chen")
    private String displayName;

    @Schema(description = "Profile avatar image URL")
    private String avatarUrl;

    @Schema(description = "Social follower verification status")
    private VerificationStatus verificationStatus;

    public static AuthorSummaryResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        StudentProfile profile = user.getProfile();
        String avatar = profile != null && profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()
                ? profile.getAvatarUrl()
                : null;

        return AuthorSummaryResponse.builder()
                .id(user.getId())
                .handle(user.getHandle())
                .displayName(user.getDisplayName())
                .avatarUrl(avatar)
                .verificationStatus(user.getVerificationStatus())
                .build();
    }
}
