package com.campusconnect.service.impl;

import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.*;
import com.campusconnect.repository.InstagramVerificationRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.InstagramAuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramAuthenticationServiceImpl implements InstagramAuthenticationService {

    private final UserRepository userRepository;
    private final InstagramVerificationRepository verificationRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse completeInstagramLoginOrRegistration(
            InstagramVerification verification,
            String instagramScopedUserId,
            String verifiedUsername
    ) {
        String cleanHandle = verifiedUsername.replace("@", "").toLowerCase().trim();

        // 1. Look for existing user by Instagram Scoped User ID first
        Optional<User> userByIgsid = userRepository.findByInstagramScopedUserId(instagramScopedUserId);

        // 2. Look by Instagram username / handle
        Optional<User> userByHandle = userRepository.findByInstagramUsernameIgnoreCase(cleanHandle);
        if (userByHandle.isEmpty()) {
            userByHandle = userRepository.findByHandleIgnoreCase(cleanHandle);
        }

        User user;
        boolean isNewUser = false;

        if (userByIgsid.isPresent()) {
            user = userByIgsid.get();

            // Conflict check: if handle changed, update it safely if not colliding
            if (!user.getHandle().equalsIgnoreCase(cleanHandle)) {
                if (userRepository.findByHandleIgnoreCase(cleanHandle).isEmpty()) {
                    user.setHandle(cleanHandle);
                    user.setInstagramUsername(cleanHandle);
                }
            }

            user.setInstagramVerifiedAt(LocalDateTime.now());
            user.setVerificationStatus(VerificationStatus.VERIFIED);
            user.setAccountStatus(AccountStatus.ACTIVE);
            user = userRepository.save(user);
        } else if (userByHandle.isPresent()) {
            user = userByHandle.get();

            // Conflict check: ensure another user is not already bound to this IGSID
            if (user.getInstagramScopedUserId() != null && !user.getInstagramScopedUserId().equals(instagramScopedUserId)) {
                throw new BadRequestException("This account is already linked to a different Instagram identity.");
            }

            user.setInstagramScopedUserId(instagramScopedUserId);
            user.setInstagramUsername(cleanHandle);
            user.setInstagramVerifiedAt(LocalDateTime.now());
            user.setVerificationStatus(VerificationStatus.VERIFIED);
            user.setAccountStatus(AccountStatus.ACTIVE);
            user = userRepository.save(user);
        } else {
            // New User Registration
            isNewUser = true;
            user = User.builder()
                    .handle(cleanHandle)
                    .instagramUsername(cleanHandle)
                    .displayName(cleanHandle)
                    .instagramScopedUserId(instagramScopedUserId)
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .accountStatus(AccountStatus.ACTIVE)
                    .instagramVerifiedAt(LocalDateTime.now())
                    .department("Campus Member")
                    .graduationYear("Class of 2026")
                    .bio("Joined via verified Instagram DM!")
                    .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")
                    .build();

            user = userRepository.save(user);
            log.info("Registered new user @{} with IGSID: {}", cleanHandle, instagramScopedUserId);
        }

        // Generate application's secure JWT token
        String jwtToken = jwtService.generateToken(user.getId(), user.getHandle(), user.getInstagramScopedUserId());

        // Update verification challenge with token and user link
        verification.setJwtToken(jwtToken);
        verification.setLinkedUserId(user.getId());
        verification.setVerifiedAt(LocalDateTime.now());
        verificationRepository.save(verification);

        return AuthResponse.builder()
                .token(jwtToken)
                .user(UserResponse.fromEntity(user))
                .isNewUser(isNewUser)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginWithVerifiedChallenge(String challengeId) {
        InstagramVerification verification = verificationRepository.findByChallengeId(challengeId)
                .orElseThrow(() -> new ResourceNotFoundException("Challenge not found: " + challengeId));

        if (verification.getStatus() != ChallengeStatus.VERIFIED || verification.getJwtToken() == null) {
            throw new BadRequestException("Challenge has not completed verification yet.");
        }

        User user = userRepository.findById(verification.getLinkedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for verified challenge."));

        return AuthResponse.builder()
                .token(verification.getJwtToken())
                .user(UserResponse.fromEntity(user))
                .isNewUser(false)
                .build();
    }
}
