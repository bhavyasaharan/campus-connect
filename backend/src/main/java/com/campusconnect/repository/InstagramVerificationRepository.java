package com.campusconnect.repository;

import com.campusconnect.model.ChallengeStatus;
import com.campusconnect.model.InstagramVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstagramVerificationRepository extends JpaRepository<InstagramVerification, Long> {
    Optional<InstagramVerification> findByChallengeId(String challengeId);

    Optional<InstagramVerification> findFirstByClaimedUsernameAndStatusOrderByCreatedAtDesc(
            String claimedUsername, ChallengeStatus status);

    Optional<InstagramVerification> findTopByClaimedUsernameOrderByCreatedAtDesc(String claimedUsername);

    List<InstagramVerification> findByStatus(ChallengeStatus status);

    List<InstagramVerification> findByStatusAndExpiresAtBefore(ChallengeStatus status, LocalDateTime threshold);
}
