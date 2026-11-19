package com.campusconnect.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Dedicated entity holding a student's comprehensive profile data
 * (college, course/major, academic year, master bio, interests, avatar).
 * Completely separate from User (auth/security) and DiscoverCard (presentation/deck view).
 */
@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String college;

    @Column(length = 150)
    private String course;

    @Column(name = "graduation_year", length = 50)
    private String graduationYear;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 500)
    private String interests;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "persona_type", length = 50)
    @Builder.Default
    private PersonaType personaType = PersonaType.STUDENT;

    @Column(length = 200)
    private String headline;

    @Column(length = 150)
    private String organization;

    @Column(name = "role_title", length = 150)
    private String roleTitle;

    @Column(name = "field_of_study", length = 150)
    private String fieldOfStudy;

    @Column(name = "is_passout", nullable = false)
    @Builder.Default
    private boolean isPassout = false;

    private Integer age;

    private java.time.LocalDate birthdate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private Gender gender = Gender.PREFER_NOT_TO_SAY;

    @Column(name = "gender_preference", length = 50)
    @Builder.Default
    private String genderPreference = "EVERYONE";

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    @Builder.Default
    private ConnectionIntent intent = ConnectionIntent.OPEN_TO_ANY;

    @Column(length = 150)
    private String location;

    private Double latitude;

    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
