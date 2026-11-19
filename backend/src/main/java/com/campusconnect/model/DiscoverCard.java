package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a user's customized Discovery Card presentation.
 * One-to-one relationship with User, distinct from the personal profile.
 * Contains deck display details, catalog foreign keys, visibility toggles,
 * and the master discoverability switch.
 */
@Entity
@Table(name = "discovery_cards", indexes = {
    @Index(name = "idx_cards_is_discoverable", columnList = "is_discoverable"),
    @Index(name = "idx_cards_college_id", columnList = "college_id"),
    @Index(name = "idx_cards_company_id", columnList = "company_id"),
    @Index(name = "idx_cards_field_id", columnList = "field_of_study_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscoverCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Master Parent Toggle: If false, user is completely excluded from the discovery pool.
     */
    @Builder.Default
    @Column(name = "is_discoverable", nullable = false)
    private boolean isDiscoverable = true;

    @Column(name = "main_photo_url", length = 1000)
    private String mainPhotoUrl;

    @Column(name = "discovery_bio", length = 300)
    private String discoveryBio;

    /**
     * JSON array or list of media URLs from the user's posts that are allowed on the Discover card.
     */
    @Column(name = "allowed_media_urls", columnDefinition = "TEXT")
    private String allowedMediaUrls;

    // --- Normalized Catalog Linkages & Fallbacks ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "college_id")
    private College college;

    @Column(name = "custom_college_name", length = 200)
    private String customCollegeName;

    @Builder.Default
    @Column(name = "is_passout", nullable = false)
    private boolean isPassout = false;

    @Column(name = "passout_year")
    private Integer passoutYear;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "custom_company_name", length = 200)
    private String customCompanyName;

    @Column(name = "role_title", length = 150)
    private String roleTitle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_of_study_id")
    private FieldOfStudy fieldOfStudy;

    @Column(name = "custom_field_of_study", length = 150)
    private String customFieldOfStudy;

    // --- Demographics & Intent ---
    private Integer age;

    private LocalDate birthdate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private Gender gender = Gender.PREFER_NOT_TO_SAY;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    @Builder.Default
    private ConnectionIntent intent = ConnectionIntent.OPEN_TO_ANY;

    // --- Geospatial Coordinates & City ---
    @Column(name = "city_name", length = 150)
    private String cityName;

    private Double latitude;

    private Double longitude;

    // --- Visibility Controls ---
    @Builder.Default
    @Column(name = "show_college", nullable = false)
    private boolean showCollege = true;

    @Builder.Default
    @Column(name = "show_passout_status", nullable = false)
    private boolean showPassoutStatus = true;

    @Builder.Default
    @Column(name = "show_course", nullable = false)
    private boolean showCourse = true;

    @Builder.Default
    @Column(name = "show_field_of_study", nullable = false)
    private boolean showFieldOfStudy = true;

    @Builder.Default
    @Column(name = "show_organization", nullable = false)
    private boolean showOrganization = true;

    @Builder.Default
    @Column(name = "show_role", nullable = false)
    private boolean showRole = true;

    @Builder.Default
    @Column(name = "show_age", nullable = false)
    private boolean showAge = true;

    @Builder.Default
    @Column(name = "show_location", nullable = false)
    private boolean showLocation = true;

    @Builder.Default
    @Column(name = "show_distance", nullable = false)
    private boolean showDistance = true;

    @Builder.Default
    @Column(name = "show_intent", nullable = false)
    private boolean showIntent = true;

    @Builder.Default
    @Column(name = "show_interests", nullable = false)
    private boolean showInterests = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper methods for resolved names
    public String getResolvedCollegeName() {
        if (college != null && college.getName() != null) {
            return college.getName();
        }
        return customCollegeName;
    }

    public String getResolvedCompanyName() {
        if (company != null && company.getName() != null) {
            return company.getName();
        }
        return customCompanyName;
    }

    public String getResolvedFieldOfStudy() {
        if (fieldOfStudy != null && fieldOfStudy.getName() != null) {
            return fieldOfStudy.getName();
        }
        return customFieldOfStudy;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
