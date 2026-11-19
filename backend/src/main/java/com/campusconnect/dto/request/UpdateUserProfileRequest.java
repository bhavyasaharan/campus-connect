package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for updating student profile")
public class UpdateUserProfileRequest {

    @NotBlank(message = "Display name cannot be empty")
    @Size(max = 150, message = "Display name cannot exceed 150 characters")
    @Schema(description = "Full name or preferred campus display name", example = "Sophia Chen")
    private String displayName;

    @Schema(description = "User contact email", example = "sophia@example.com")
    private String email;

    @Schema(description = "User mobile / phone number", example = "+1 555-0199")
    private String phone;

    @Size(max = 150, message = "College cannot exceed 150 characters")
    @Schema(description = "College or university name", example = "Stanford University")
    private String college;

    @Size(max = 150, message = "Course cannot exceed 150 characters")
    @Schema(description = "Course or degree program the student is enrolled in", example = "Computer Science & Engineering")
    private String course;

    @Size(max = 100, message = "Department/major cannot exceed 100 characters")
    @Schema(description = "Academic major or department", example = "Cognitive Science & Design")
    private String department;

    @Size(max = 50, message = "Graduation year cannot exceed 50 characters")
    @Schema(description = "Class or graduation year", example = "Senior 2025")
    private String graduationYear;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    @Schema(description = "Personal biography or intro", example = "Passionate about human-computer interaction and campus robotics.")
    private String bio;

    @Size(max = 2048, message = "Avatar URL cannot exceed 2048 characters")
    @Schema(description = "Profile picture / avatar image URL", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;

    @Schema(description = "List of student interests or hobbies", example = "[\"Robotics\", \"Design\", \"Photography\"]")
    private List<String> interests;

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

    @Schema(description = "Whether the user has passed out / alumni", example = "false")
    private Boolean isPassout;

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
}
