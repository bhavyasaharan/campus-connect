package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_handle", columnList = "handle", unique = true),
    @Index(name = "idx_user_ig_username", columnList = "instagramUsername", unique = true),
    @Index(name = "idx_user_ig_scoped_id", columnList = "instagramScopedUserId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String handle;

    @Column(unique = true, length = 100)
    private String instagramUsername;

    @Column(unique = true, length = 100)
    private String instagramScopedUserId;

    @Column(nullable = false, length = 150)
    private String displayName;

    @Column(length = 100)
    private String department;

    @Column(length = 50)
    private String graduationYear;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.VERIFIED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    private LocalDateTime gracePeriodExpiresAt;

    private LocalDateTime lastVerifiedAt;

    private LocalDateTime instagramVerifiedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.instagramUsername == null && this.handle != null) {
            this.instagramUsername = this.handle;
        }
        if (this.handle == null && this.instagramUsername != null) {
            this.handle = this.instagramUsername;
        }
    }
}
