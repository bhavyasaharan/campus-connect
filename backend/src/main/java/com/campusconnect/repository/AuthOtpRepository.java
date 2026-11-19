package com.campusconnect.repository;

import com.campusconnect.model.AuthOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AuthOtpRepository extends JpaRepository<AuthOtp, Long> {
    Optional<AuthOtp> findTopByIdentifierIgnoreCaseAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String identifier,
        LocalDateTime now
    );
}
