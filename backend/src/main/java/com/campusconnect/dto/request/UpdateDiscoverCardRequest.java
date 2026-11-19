package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body to customize the user's Discover Card presentation & card-specific attributes")
public class UpdateDiscoverCardRequest {

    @Schema(description = "Master Discoverability toggle. If false, user is excluded from discovery feed.", example = "true")
    private Boolean isDiscoverable;

    @Schema(description = "Selected main photograph URL filling the card background", example = "http://localhost:8080/api/upload/image/photo1.jpg")
    private String mainPhotoUrl;

    @Size(max = 300, message = "Discovery bio cannot exceed 300 characters")
    @Schema(description = "Independent discovery bio / deck headline (max 300 characters)", example = "Building AI projects by day, exploring live music by night.")
    private String discoveryBio;

    @Schema(description = "List of approved/allowed post media URLs to display on the Discover card and expanded profile gallery", example = "[\"http://localhost:8080/api/upload/image/photo1.jpg\"]")
    private List<String> allowedMediaUrls;

    // --- College Catalog Linkage ---
    @Schema(description = "Catalog College ID (if selected from autocomplete)", example = "1")
    private Long collegeId;

    @Schema(description = "College or campus name", example = "Ajay Kumar Garg Engineering College (AKGEC)")
    private String college;

    @Schema(description = "Custom college name (if user typed their own)", example = "Custom University")
    private String customCollegeName;

    @Schema(description = "Whether user has passed out / alumni", example = "false")
    private Boolean isPassout;

    @Schema(description = "Graduation class / passout year", example = "2026")
    private Integer passoutYear;

    // --- Company Catalog Linkage ---
    @Schema(description = "Catalog Company ID (if selected from autocomplete)", example = "5")
    private Long companyId;

    @Schema(description = "Workplace or company name", example = "Google")
    private String organization;

    @Schema(description = "Custom company name", example = "Acme Labs")
    private String customCompanyName;

    @Schema(description = "Job title or role", example = "Software Engineer")
    private String roleTitle;

    // --- Field of Study Catalog Linkage ---
    @Schema(description = "Catalog Field of Study ID", example = "2")
    private Long fieldOfStudyId;

    @Schema(description = "Field of study / major", example = "Computer Science & Engineering")
    private String fieldOfStudy;

    @Schema(description = "Custom field of study", example = "Quantum Computing")
    private String customFieldOfStudy;

    // --- Demographics & Intent ---
    @Schema(description = "User age", example = "24")
    private Integer age;

    @Schema(description = "Birthdate", example = "2000-05-15")
    private LocalDate birthdate;

    @Schema(description = "User gender", example = "MALE")
    private String gender;

    @Schema(description = "Card intent (DATING, NETWORKING, FRIENDSHIP, CAMPUS, CASUAL)", example = "DATING")
    private String intent;

    // --- Geospatial Coordinates & Location ---
    @Schema(description = "City / location name", example = "Ghaziabad, Uttar Pradesh")
    private String location;

    @Schema(description = "Geographic latitude", example = "28.6692")
    private Double latitude;

    @Schema(description = "Geographic longitude", example = "77.4538")
    private Double longitude;

    // --- Visibility Controls ---
    @Schema(description = "Whether to show college on the card", example = "true")
    private Boolean showCollege;

    @Schema(description = "Whether to show passout status on the card", example = "true")
    private Boolean showPassoutStatus;

    @Schema(description = "Whether to show course/major on the card", example = "true")
    private Boolean showCourse;

    @Schema(description = "Whether to show field of study on the card", example = "true")
    private Boolean showFieldOfStudy;

    @Schema(description = "Whether to show organization/company on the card", example = "true")
    private Boolean showOrganization;

    @Schema(description = "Whether to show role title on the card", example = "true")
    private Boolean showRole;

    @Schema(description = "Whether to show age on the card", example = "true")
    private Boolean showAge;

    @Schema(description = "Whether to show location/city on the card", example = "true")
    private Boolean showLocation;

    @Schema(description = "Whether to show distance in km on the card", example = "true")
    private Boolean showDistance;

    @Schema(description = "Whether to show intent badge on the card", example = "true")
    private Boolean showIntent;

    @Schema(description = "Whether to show interests on the card", example = "true")
    private Boolean showInterests;

    @Schema(description = "Card interests tags", example = "[\"Tech\", \"Music\"]")
    private List<String> interests;
}
