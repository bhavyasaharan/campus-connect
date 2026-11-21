package com.campusconnect.dto.response;

import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

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

    @Schema(description = "College or university name", example = "Stanford University")
    private String college;

    @Schema(description = "Course or degree program", example = "Computer Science & Engineering")
    private String course;

    @Schema(description = "Academic major / department", example = "Cognitive Science & Design")
    private String department;

    @Schema(description = "Graduation class / year", example = "Senior 2025")
    private String graduationYear;

    @Schema(description = "Personal biography", example = "Figma enthusiast, analog film shooter, ambient synthwave.")
    private String bio;

    @Schema(description = "Student interests and tags", example = "[\"Design\", \"Robotics\", \"Photography\"]")
    private List<String> interests;

    @Schema(description = "Profile avatar image URL", example = "https://images.unsplash.com/photo-1517841905240-472988babdf9")
    private String avatarUrl;

    @Schema(description = "Social follower verification status (VERIFIED, GRACE_PERIOD, RESTRICTED)", example = "VERIFIED")
    private VerificationStatus verificationStatus;

    @Schema(description = "Timestamp when 24h grace period expires")
    private LocalDateTime gracePeriodExpiresAt;

    @Schema(description = "Timestamp when last verified against official Instagram followers")
    private LocalDateTime lastVerifiedAt;

    @Schema(description = "Student email address", example = "sophia@campus.edu")
    private String email;

    @Schema(description = "Student contact phone number", example = "+15551234567")
    private String phone;

    @Schema(description = "Timestamp when student registered")
    private LocalDateTime createdAt;

    @Schema(description = "Persona type: STUDENT, PASSOUT, WORKING_PROFESSIONAL, FREELANCER, OTHER", example = "STUDENT")
    private String personaType;

    @Schema(description = "User headline", example = "Software Engineer @ Google")
    private String headline;

    @Schema(description = "Company or workplace", example = "Google")
    private String organization;

    @Schema(description = "Job title or role", example = "Frontend Engineer")
    private String roleTitle;

    @Schema(description = "Field of study / major", example = "Computer Science")
    private String fieldOfStudy;

    @JsonProperty("isPassout")
    @Schema(description = "Whether the user has passed out / alumni", example = "false")
    private boolean isPassout;

    @Schema(description = "Age of user", example = "24")
    private Integer age;

    @Schema(description = "Birthdate of user")
    private java.time.LocalDate birthdate;

    @Schema(description = "Gender of user", example = "MALE")
    private String gender;

    @Schema(description = "Gender preference for dating", example = "EVERYONE")
    private String genderPreference;

    @Schema(description = "Intent: DATING, NETWORKING, FRIENDSHIP, CAMPUS_BUDDIES, CASUAL, OPEN_TO_ANY", example = "DATING")
    private String intent;

    @Schema(description = "User location or city", example = "San Francisco, CA")
    private String location;

    private Double latitude;
    private Double longitude;

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return fromEntity(user, user.getProfile());
    }

    public static UserResponse fromEntity(User user, StudentProfile profile) {
        if (user == null) return null;

        StudentProfile resolvedProfile = profile != null ? profile : user.getProfile();

        String college = resolvedProfile != null && resolvedProfile.getCollege() != null && !resolvedProfile.getCollege().isBlank()
                ? resolvedProfile.getCollege()
                : "Campus University";

        String course = resolvedProfile != null && resolvedProfile.getCourse() != null && !resolvedProfile.getCourse().isBlank()
                ? resolvedProfile.getCourse()
                : "General Studies";

        String department = course;

        String gradYear = resolvedProfile != null && resolvedProfile.getGraduationYear() != null && !resolvedProfile.getGraduationYear().isBlank()
                ? resolvedProfile.getGraduationYear()
                : "Class of 2026";

        String bio = resolvedProfile != null && resolvedProfile.getBio() != null && !resolvedProfile.getBio().isBlank()
                ? resolvedProfile.getBio()
                : "Campus community member excited to connect.";

        String avatar = resolvedProfile != null && resolvedProfile.getAvatarUrl() != null && !resolvedProfile.getAvatarUrl().isBlank()
                ? resolvedProfile.getAvatarUrl()
                : null;

        List<String> interestsList = List.of();
        if (resolvedProfile != null && resolvedProfile.getInterests() != null && !resolvedProfile.getInterests().isBlank()) {
            interestsList = Arrays.stream(resolvedProfile.getInterests().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        return UserResponse.builder()
                .id(user.getId())
                .handle(user.getHandle())
                .displayName(user.getDisplayName())
                .college(college)
                .course(course)
                .department(department)
                .graduationYear(gradYear)
                .bio(bio)
                .interests(interestsList)
                .avatarUrl(avatar)
                .email(user.getEmail())
                .phone(user.getPhone())
                .verificationStatus(user.getVerificationStatus())
                .gracePeriodExpiresAt(user.getGracePeriodExpiresAt())
                .lastVerifiedAt(user.getLastVerifiedAt())
                .personaType(resolvedProfile != null && resolvedProfile.getPersonaType() != null ? resolvedProfile.getPersonaType().name() : "STUDENT")
                .headline(resolvedProfile != null ? resolvedProfile.getHeadline() : null)
                .organization(resolvedProfile != null ? resolvedProfile.getOrganization() : null)
                .roleTitle(resolvedProfile != null ? resolvedProfile.getRoleTitle() : null)
                .fieldOfStudy(resolvedProfile != null && resolvedProfile.getFieldOfStudy() != null ? resolvedProfile.getFieldOfStudy() : course)
                .isPassout(resolvedProfile != null && resolvedProfile.isPassout())
                .age(resolvedProfile != null ? resolvedProfile.getAge() : null)
                .birthdate(resolvedProfile != null ? resolvedProfile.getBirthdate() : null)
                .gender(resolvedProfile != null && resolvedProfile.getGender() != null ? resolvedProfile.getGender().name() : "PREFER_NOT_TO_SAY")
                .genderPreference(resolvedProfile != null && resolvedProfile.getGenderPreference() != null ? resolvedProfile.getGenderPreference() : "EVERYONE")
                .intent(resolvedProfile != null && resolvedProfile.getIntent() != null ? resolvedProfile.getIntent().name() : "OPEN_TO_ANY")
                .location(resolvedProfile != null ? resolvedProfile.getLocation() : null)
                .latitude(resolvedProfile != null ? resolvedProfile.getLatitude() : null)
                .longitude(resolvedProfile != null ? resolvedProfile.getLongitude() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
