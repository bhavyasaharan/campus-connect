package com.campusconnect.service.impl;

import com.campusconnect.config.CampusVerificationProperties;
import com.campusconnect.config.MetaInstagramProperties;
import com.campusconnect.constant.AppConstants;
import com.campusconnect.dto.response.InstagramChallengeResponse;
import com.campusconnect.dto.response.InstagramVerificationStatusResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.ChallengeStatus;
import com.campusconnect.model.InstagramVerification;
import com.campusconnect.model.User;
import com.campusconnect.repository.InstagramVerificationRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.InstagramAuthenticationService;
import com.campusconnect.service.InstagramEligibilityService;
import com.campusconnect.service.InstagramVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramVerificationServiceImpl implements InstagramVerificationService {

    private final InstagramVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final InstagramEligibilityService eligibilityService;
    private final InstagramAuthenticationService authenticationService;
    private final MetaInstagramProperties properties;
    private final CampusVerificationProperties verificationProperties;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Pattern otpRegex = Pattern.compile(AppConstants.OTP_REGEX_PATTERN);

    @Override
    @Transactional
    public InstagramChallengeResponse createChallenge(String rawUsername) {
        String cleanUsername = rawUsername.replace("@", "").toLowerCase().trim();

        // 1. Check for active cooldown on recent challenge for this username
        Optional<InstagramVerification> recentOpt = verificationRepository
                .findTopByClaimedUsernameOrderByCreatedAtDesc(cleanUsername);

        if (recentOpt.isPresent()) {
            InstagramVerification recent = recentOpt.get();
            LocalDateTime cooldownUntil = (recent.getLastResentAt() != null ? recent.getLastResentAt() : recent.getCreatedAt())
                    .plusSeconds(verificationProperties.getResendCooldownSeconds());

            if (LocalDateTime.now().isBefore(cooldownUntil)) {
                long secondsLeft = ChronoUnit.SECONDS.between(LocalDateTime.now(), cooldownUntil);
                throw new BadRequestException("Please wait " + Math.max(1, secondsLeft) + "s before requesting a new challenge.");
            }

            // Invalidate any lingering pending challenge for this username
            if (recent.getStatus() == ChallengeStatus.PENDING) {
                recent.setStatus(ChallengeStatus.EXPIRED);
                recent.setFailureReason("Superseded by new verification challenge");
                verificationRepository.save(recent);
            }
        }

        // 2. Generate cryptographically secure 6-digit OTP and unique Challenge ID
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String challengeId = UUID.randomUUID().toString();
        String otpHash = hashOtp(otp, challengeId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(verificationProperties.getOtpExpiryMinutes());
        LocalDateTime resendAvailableAt = now.plusSeconds(verificationProperties.getResendCooldownSeconds());

        // 3. Persist verification challenge
        InstagramVerification verification = InstagramVerification.builder()
                .challengeId(challengeId)
                .claimedUsername(cleanUsername)
                .otpHash(otpHash)
                .status(ChallengeStatus.PENDING)
                .expiresAt(expiresAt)
                .attempts(0)
                .createdAt(now)
                .lastResentAt(now)
                .build();

        verificationRepository.save(verification);
        log.info("Created Instagram verification challenge for username: @{} (challengeId: {})", cleanUsername, challengeId);

        return InstagramChallengeResponse.builder()
                .challengeId(challengeId)
                .otp(otp)
                .claimedUsername(cleanUsername)
                .expiresAt(expiresAt)
                .resendAvailableAt(resendAvailableAt)
                .communityAccount(properties.getCommunityAccount())
                .instructions("Open Instagram, visit @" + properties.getCommunityAccount() + " and send this 6-digit code via Direct Message.")
                .build();
    }

    @Override
    @Transactional
    public InstagramChallengeResponse resendOtp(String challengeId) {
        InstagramVerification verification = verificationRepository.findByChallengeId(challengeId)
                .orElseThrow(() -> new ResourceNotFoundException("Verification challenge not found."));

        if (verification.getStatus() != ChallengeStatus.PENDING) {
            throw new BadRequestException("Challenge is not in pending state.");
        }

        LocalDateTime cooldownUntil = (verification.getLastResentAt() != null ? verification.getLastResentAt() : verification.getCreatedAt())
                .plusSeconds(verificationProperties.getResendCooldownSeconds());

        if (LocalDateTime.now().isBefore(cooldownUntil)) {
            long secondsLeft = ChronoUnit.SECONDS.between(LocalDateTime.now(), cooldownUntil);
            throw new BadRequestException("Please wait " + Math.max(1, secondsLeft) + "s before resending code.");
        }

        String newOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newExpiresAt = now.plusMinutes(verificationProperties.getOtpExpiryMinutes());

        verification.setOtpHash(hashOtp(newOtp, challengeId));
        verification.setExpiresAt(newExpiresAt);
        verification.setLastResentAt(now);
        verification.setAttempts(0);
        verificationRepository.save(verification);

        return InstagramChallengeResponse.builder()
                .challengeId(challengeId)
                .otp(newOtp)
                .claimedUsername(verification.getClaimedUsername())
                .expiresAt(newExpiresAt)
                .resendAvailableAt(now.plusSeconds(verificationProperties.getResendCooldownSeconds()))
                .communityAccount(properties.getCommunityAccount())
                .instructions("Open Instagram, visit @" + properties.getCommunityAccount() + " and send this 6-digit code via Direct Message.")
                .build();
    }

    @Override
    @Transactional
    public InstagramVerificationStatusResponse getVerificationStatus(String challengeId) {
        InstagramVerification verification = verificationRepository.findByChallengeId(challengeId)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found: " + challengeId));

        // Check if expired
        if (verification.getStatus() == ChallengeStatus.PENDING && LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            verification.setStatus(ChallengeStatus.EXPIRED);
            verification.setFailureReason("Verification code expired after 5 minutes.");
            verificationRepository.save(verification);
        }

        UserResponse userResponse = null;
        if (verification.getLinkedUserId() != null) {
            userResponse = userRepository.findById(verification.getLinkedUserId())
                    .map(UserResponse::fromEntity)
                    .orElse(null);
        }

        return InstagramVerificationStatusResponse.builder()
                .challengeId(verification.getChallengeId())
                .status(verification.getStatus())
                .verified(verification.getStatus() == ChallengeStatus.VERIFIED)
                .failureReason(verification.getFailureReason())
                .jwtToken(verification.getJwtToken())
                .user(userResponse)
                .expiresAt(verification.getExpiresAt())
                .build();
    }

    @Override
    @Transactional
    public void processIncomingMessage(String senderIgsid, String actualSenderUsername, String messageText) {
        if (messageText == null || messageText.isBlank()) {
            return;
        }

        // 1. Extract 6-digit OTP from message text
        String extractedOtp = null;
        Matcher matcher = otpRegex.matcher(messageText);
        if (matcher.find()) {
            extractedOtp = matcher.group(1);
        }

        if (extractedOtp == null) {
            log.info("Incoming DM from IGSID {} did not contain a 6-digit OTP.", senderIgsid);
            return;
        }

        // 2. Find pending challenges
        List<InstagramVerification> pendingChallenges = verificationRepository.findByStatus(ChallengeStatus.PENDING);
        InstagramVerification matchedChallenge = null;

        for (InstagramVerification challenge : pendingChallenges) {
            if (verifyOtp(extractedOtp, challenge.getChallengeId(), challenge.getOtpHash())) {
                matchedChallenge = challenge;
                break;
            }
        }

        if (matchedChallenge == null) {
            log.warn("No active pending challenge matched the provided OTP from sender IGSID: {}", senderIgsid);
            return;
        }

        // 3. Check attempts limit
        matchedChallenge.setAttempts(matchedChallenge.getAttempts() + 1);
        if (matchedChallenge.getAttempts() > verificationProperties.getMaxVerificationAttempts()) {
            matchedChallenge.setStatus(ChallengeStatus.MAX_ATTEMPTS_EXCEEDED);
            matchedChallenge.setFailureReason("Maximum verification attempts exceeded.");
            verificationRepository.save(matchedChallenge);
            return;
        }

        // 4. Check expiry
        if (LocalDateTime.now().isAfter(matchedChallenge.getExpiresAt())) {
            matchedChallenge.setStatus(ChallengeStatus.EXPIRED);
            matchedChallenge.setFailureReason("Verification challenge has expired.");
            verificationRepository.save(matchedChallenge);
            return;
        }

        // 5. Verify actual sender username matches claimed username (if available)
        String claimed = matchedChallenge.getClaimedUsername().toLowerCase().trim();
        if (actualSenderUsername != null && !actualSenderUsername.isBlank()) {
            String actual = actualSenderUsername.replace("@", "").toLowerCase().trim();
            if (!actual.equalsIgnoreCase(claimed)) {
                log.warn("Instagram sender username mismatch! Claimed: @{}, Actual sender: @{}", claimed, actual);
                matchedChallenge.setStatus(ChallengeStatus.FAILED);
                matchedChallenge.setFailureReason("Sender Instagram account @" + actual + " does not match claimed username @" + claimed);
                verificationRepository.save(matchedChallenge);
                return;
            }
        }

        matchedChallenge.setInstagramScopedUserId(senderIgsid);

        // 6. Complete Authentication (Registration or Login)
        try {
            matchedChallenge.setStatus(ChallengeStatus.VERIFIED);
            authenticationService.completeInstagramLoginOrRegistration(
                    matchedChallenge,
                    senderIgsid,
                    claimed
            );
            log.info("Instagram identity verified successfully for @{}", claimed);
        } catch (Exception e) {
            log.error("Failed to complete authentication for @{}: {}", claimed, e.getMessage());
            matchedChallenge.setStatus(ChallengeStatus.FAILED);
            matchedChallenge.setFailureReason(e.getMessage());
            verificationRepository.save(matchedChallenge);
        }
    }

    private String hashOtp(String otp, String challengeId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = challengeId + ":" + otp + ":" + properties.getAppSecret();
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing OTP: " + e.getMessage());
        }
    }

    private boolean verifyOtp(String candidateOtp, String challengeId, String storedHash) {
        String computedHash = hashOtp(candidateOtp, challengeId);
        return MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8)
        );
    }
}
