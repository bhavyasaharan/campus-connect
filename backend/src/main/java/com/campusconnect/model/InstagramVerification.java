package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "instagram_verifications", indexes = {
    @Index(name = "idx_ig_challenge_id", columnList = "challengeId", unique = true),
    @Index(name = "idx_ig_claimed_username", columnList = "claimedUsername"),
    @Index(name = "idx_ig_scoped_user_id", columnList = "instagramScopedUserId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstagramVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String challengeId;

    @Column(nullable = false, length = 100)
    private String claimedUsername;

    @Column(nullable = false, length = 255)
    private String otpHash;

    @Column(length = 100)
    private String instagramScopedUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime verifiedAt;

    private LocalDateTime lastResentAt;

    @Column(length = 500)
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String jwtToken;

    private Long linkedUserId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.expiresAt == null) {
            this.expiresAt = LocalDateTime.now().plusMinutes(5);
        }
    }
}
