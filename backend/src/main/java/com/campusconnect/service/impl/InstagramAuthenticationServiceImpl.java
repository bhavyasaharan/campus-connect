package com.campusconnect.service.impl;

import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ChallengeStatus;
import com.campusconnect.model.InstagramVerification;
import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.UserType;
import com.campusconnect.model.VerificationStatus;
import com.campusconnect.repository.InstagramVerificationRepository;
import com.campusconnect.repository.StudentProfileRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.AuthSessionLogService;
import com.campusconnect.service.InstagramAuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramAuthenticationServiceImpl implements InstagramAuthenticationService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final InstagramVerificationRepository verificationRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionLogService authSessionLogService;

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

            // Conflict check: allow simulated/dev IGSID to be cleanly updated to real live Meta IGSID
            if (user.getInstagramScopedUserId() != null && !user.getInstagramScopedUserId().equals(instagramScopedUserId)) {
                boolean isDevOrSimulated = user.getInstagramScopedUserId().startsWith("dev_")
                        || user.getInstagramScopedUserId().startsWith("sim_")
                        || user.getInstagramScopedUserId().startsWith("mock_")
                        || instagramScopedUserId.startsWith("dev_")
                        || instagramScopedUserId.startsWith("sim_");
                if (!isDevOrSimulated) {
                    throw new BadRequestException("This account is already linked to a different Instagram identity.");
                }
                log.info("Transitioning user @{} from dev/simulated IGSID {} to live IGSID {}",
                        cleanHandle, user.getInstagramScopedUserId(), instagramScopedUserId);
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
                    .passwordHash(passwordEncoder.encode("Campus@123"))
                    .build();

            user = userRepository.save(user);

            StudentProfile profile = StudentProfile.builder()
                    .user(user)
                    .college("Campus University")
                    .course("Campus Member")
                    .graduationYear("Class of 2026")
                    .bio("Joined via verified Instagram DM!")
                    .avatarUrl(null)
                    .interests("Student, Campus Life, Tech, Music")
                    .build();
            studentProfileRepository.save(profile);
            log.info("Registered new user @{} with IGSID: {}", cleanHandle, instagramScopedUserId);
        }

        // Generate application's secure JWT token
        String jwtToken = jwtService.generateToken(user.getId(), user.getHandle(), user.getInstagramScopedUserId());

        // Update verification challenge with token and user link
        verification.setJwtToken(jwtToken);
        verification.setLinkedUserId(user.getId());
        verification.setVerifiedAt(LocalDateTime.now());
        verificationRepository.save(verification);

        authSessionLogService.recordLogin(UserType.STUDENT, user.getId(), user.getHandle(), "INSTAGRAM");

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
