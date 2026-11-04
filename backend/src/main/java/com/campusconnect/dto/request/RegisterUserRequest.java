package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Student registration request payload")
public class RegisterUserRequest {

    @NotBlank(message = "Campus / Instagram handle is required")
    @Pattern(
        regexp = "^[a-zA-Z0-9._]{2,30}$",
        message = "Handle must be between 2 and 30 characters and contain only letters, numbers, periods, or underscores"
    )
    @Schema(description = "Instagram handle without @", example = "sophia_chen", requiredMode = Schema.RequiredMode.REQUIRED)
    private String handle;

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100, message = "Display name must be between 2 and 100 characters")
    @Schema(description = "Full student display name", example = "Sophia Chen", requiredMode = Schema.RequiredMode.REQUIRED)
    private String displayName;

    @Size(max = 100, message = "Department cannot exceed 100 characters")
    @Schema(description = "Academic major / department", example = "Computer Science & Design")
    private String department;

    @Size(max = 50, message = "Graduation year cannot exceed 50 characters")
    @Schema(description = "Graduation class / year", example = "Senior 2025")
    private String graduationYear;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    @Schema(description = "Student personal bio", example = "Figma enthusiast, photographer, and hackathon lover.")
    private String bio;

    @Schema(description = "Profile avatar image URL", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;
}
