package com.campusconnect.dto.response;

import com.campusconnect.model.DiscoverCard;
import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
@Schema(description = "Discovery Card presentation response")
public class DiscoverCardResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Schema(description = "Card ID", example = "1")
    private Long id;

    @Schema(description = "Account summary")
    private UserResponse user;

    @JsonProperty("isDiscoverable")
    @Schema(description = "Master discoverability switch")
    private boolean isDiscoverable;

    @Schema(description = "Selected main photograph URL filling the card background")
    private String mainPhotoUrl;

    @Schema(description = "Independent discovery bio / deck headline")
    private String discoveryBio;

    // --- Resolved Catalog Details ---
    @Schema(description = "Catalog College ID")
    private Long collegeId;

    @Schema(description = "Resolved College Name")
    private String college;

    @JsonProperty("isPassout")
    @Schema(description = "Whether user is passout/alumni")
    private boolean isPassout;

    @Schema(description = "Graduation or passout year")
    private Integer passoutYear;

    @Schema(description = "Catalog Company ID")
    private Long companyId;

    @Schema(description = "Resolved Company Name")
    private String organization;

    @Schema(description = "Role title / job profession")
    private String roleTitle;

    @Schema(description = "Catalog Field of Study ID")
    private Long fieldOfStudyId;

    @Schema(description = "Resolved Field of Study")
    private String fieldOfStudy;

    @Schema(description = "Age of user")
    private Integer age;

    @Schema(description = "Birthdate of user")
    private LocalDate birthdate;

    @Schema(description = "Gender of user")
    private String gender;

    @Schema(description = "User intent (DATING, NETWORKING, FRIENDSHIP, CAMPUS, CASUAL)")
    private String intent;

    @Schema(description = "Location / city name")
    private String location;

    @Schema(description = "Latitude")
    private Double latitude;

    @Schema(description = "Longitude")
    private Double longitude;

    @Schema(description = "Calculated distance from viewer in kilometers")
    private Double distanceKm;

    // --- Visibility Controls ---
    private boolean showCollege;
    private boolean showPassoutStatus;
    private boolean showCourse;
    private boolean showFieldOfStudy;
    private boolean showOrganization;
    private boolean showRole;
    private boolean showAge;
    private boolean showLocation;
    private boolean showDistance;
    private boolean showIntent;
    private boolean showInterests;

    @Schema(description = "Interests and tags")
    private List<String> interests;

    @Schema(description = "Available uploaded photos for card selection")
    private List<String> availablePhotos;

    @Schema(description = "Approved post media URLs allowed to appear on Discover card")
    private List<String> allowedMediaUrls;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DiscoverCardResponse fromEntity(DiscoverCard card, User user, List<String> availablePhotos, List<String> interests) {
        return fromEntity(card, user, null, availablePhotos, interests, null);
    }

    public static DiscoverCardResponse fromEntity(DiscoverCard card, User user, StudentProfile profile, List<String> availablePhotos, List<String> interests) {
        return fromEntity(card, user, profile, availablePhotos, interests, null);
    }

    public static DiscoverCardResponse fromEntity(DiscoverCard card, User user, StudentProfile profile, List<String> availablePhotos, List<String> interests, Double distanceKm) {
        StudentProfile resolvedProfile = profile != null ? profile : (user != null ? user.getProfile() : null);

        String mainPhoto = card != null && card.getMainPhotoUrl() != null && !card.getMainPhotoUrl().isBlank()
                ? card.getMainPhotoUrl()
                : (resolvedProfile != null && resolvedProfile.getAvatarUrl() != null ? resolvedProfile.getAvatarUrl() : "");

        String bio = card != null && card.getDiscoveryBio() != null
                ? card.getDiscoveryBio()
                : (resolvedProfile != null && resolvedProfile.getBio() != null ? resolvedProfile.getBio() : "");

        // Resolve College: DiscoverCard owns it first, fallback to Profile
        String resolvedCollege = card != null ? card.getResolvedCollegeName() : null;
        if ((resolvedCollege == null || resolvedCollege.isBlank()) && resolvedProfile != null) {
            resolvedCollege = resolvedProfile.getCollege();
        }

        // Resolve Company / Organization
        String resolvedOrg = card != null ? card.getResolvedCompanyName() : null;
        if ((resolvedOrg == null || resolvedOrg.isBlank()) && resolvedProfile != null) {
            resolvedOrg = resolvedProfile.getOrganization();
        }

        // Resolve Field of Study
        String resolvedFos = card != null ? card.getResolvedFieldOfStudy() : null;
        if ((resolvedFos == null || resolvedFos.isBlank()) && resolvedProfile != null) {
            resolvedFos = resolvedProfile.getFieldOfStudy() != null ? resolvedProfile.getFieldOfStudy() : resolvedProfile.getCourse();
        }

        // Resolve Role Title
        String resolvedRole = card != null && card.getRoleTitle() != null ? card.getRoleTitle() : (resolvedProfile != null ? resolvedProfile.getRoleTitle() : null);

        // Resolve Passout
        boolean isPassout = card != null ? card.isPassout() : (resolvedProfile != null && resolvedProfile.isPassout());

        // Resolve Age
        Integer age = card != null && card.getAge() != null ? card.getAge() : (resolvedProfile != null ? resolvedProfile.getAge() : null);

        // Resolve Gender
        String gender = card != null && card.getGender() != null ? card.getGender().name() : (resolvedProfile != null && resolvedProfile.getGender() != null ? resolvedProfile.getGender().name() : "PREFER_NOT_TO_SAY");

        // Resolve Intent
        String intent = card != null && card.getIntent() != null ? card.getIntent().name() : (resolvedProfile != null && resolvedProfile.getIntent() != null ? resolvedProfile.getIntent().name() : "OPEN_TO_ANY");

        // Resolve Location / City
        String location = card != null && card.getCityName() != null ? card.getCityName() : (resolvedProfile != null ? resolvedProfile.getLocation() : null);

        // Visibility Toggles
        boolean isDisc = card == null || card.isDiscoverable();
        boolean showCol = card == null || card.isShowCollege();
        boolean showPass = card == null || card.isShowPassoutStatus();
        boolean showCou = card == null || card.isShowCourse();
        boolean showFos = card == null || card.isShowFieldOfStudy();
        boolean showOrg = card == null || card.isShowOrganization();
        boolean showRol = card == null || card.isShowRole();
        boolean showAge = card == null || card.isShowAge();
        boolean showLoc = card == null || card.isShowLocation();
        boolean showDist = card == null || card.isShowDistance();
        boolean showInn = card == null || card.isShowIntent();
        boolean showInt = card == null || card.isShowInterests();

        List<String> resolvedInterests = interests != null ? interests : (
                resolvedProfile != null && resolvedProfile.getInterests() != null && !resolvedProfile.getInterests().isBlank()
                        ? Arrays.stream(resolvedProfile.getInterests().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList()
                        : Collections.emptyList()
        );

        List<String> allowedMedias = new ArrayList<>();
        if (card != null && card.getAllowedMediaUrls() != null && !card.getAllowedMediaUrls().isBlank()) {
            String raw = card.getAllowedMediaUrls().trim();
            if (raw.startsWith("[")) {
                try {
                    allowedMedias = OBJECT_MAPPER.readValue(raw, new TypeReference<List<String>>() {});
                } catch (Exception e) {
                    log.debug("Failed to parse allowedMediaUrls JSON for card {}: {}", card.getId(), e.getMessage());
                }
            } else {
                for (String part : raw.split(",")) {
                    if (!part.trim().isEmpty()) {
                        allowedMedias.add(part.trim());
                    }
                }
            }
        }

        return DiscoverCardResponse.builder()
                .id(card != null ? card.getId() : null)
                .user(UserResponse.fromEntity(user, resolvedProfile))
                .isDiscoverable(isDisc)
                .mainPhotoUrl(mainPhoto)
                .discoveryBio(bio)
                .collegeId(card != null && card.getCollege() != null ? card.getCollege().getId() : null)
                .college(resolvedCollege)
                .isPassout(isPassout)
                .passoutYear(card != null ? card.getPassoutYear() : null)
                .companyId(card != null && card.getCompany() != null ? card.getCompany().getId() : null)
                .organization(resolvedOrg)
                .roleTitle(resolvedRole)
                .fieldOfStudyId(card != null && card.getFieldOfStudy() != null ? card.getFieldOfStudy().getId() : null)
                .fieldOfStudy(resolvedFos)
                .age(age)
                .birthdate(card != null ? card.getBirthdate() : (resolvedProfile != null ? resolvedProfile.getBirthdate() : null))
                .gender(gender)
                .intent(intent)
                .location(location)
                .latitude(card != null ? card.getLatitude() : null)
                .longitude(card != null ? card.getLongitude() : null)
                .distanceKm(distanceKm != null ? Math.round(distanceKm * 10.0) / 10.0 : null)
                .showCollege(showCol)
                .showPassoutStatus(showPass)
                .showCourse(showCou)
                .showFieldOfStudy(showFos)
                .showOrganization(showOrg)
                .showRole(showRol)
                .showAge(showAge)
                .showLocation(showLoc)
                .showDistance(showDist)
                .showIntent(showInn)
                .showInterests(showInt)
                .interests(resolvedInterests != null ? resolvedInterests : List.of())
                .availablePhotos(availablePhotos)
                .allowedMediaUrls(allowedMedias)
                .createdAt(card != null ? card.getCreatedAt() : null)
                .updatedAt(card != null ? card.getUpdatedAt() : null)
                .build();
    }
}
