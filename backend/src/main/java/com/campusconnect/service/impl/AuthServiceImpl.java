package com.campusconnect.service.impl;

import com.campusconnect.dto.request.ChangePasswordRequest;
import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.OtpRequest;
import com.campusconnect.dto.request.VerifyOtpRequest;
import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.OtpResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AuthOtp;
import com.campusconnect.model.User;
import com.campusconnect.model.UserType;
import com.campusconnect.repository.AuthOtpRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.AuthService;
import com.campusconnect.service.AuthSessionLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthOtpRepository authOtpRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionLogService authSessionLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String DEFAULT_INITIAL_PASSWORD = "Campus@123";

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new BadRequestException("Campus ID / Handle is required");
        }

        User user = userRepository.findByIdentifier(identifier.trim())
                .orElseThrow(() -> new BadRequestException("Invalid credentials. If you are new to CampusConnect, please complete Instagram verification first."));

        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Password is required");
        }

        // Validate password
        if (user.getPasswordHash() != null) {
            boolean matches = passwordEncoder.matches(rawPassword, user.getPasswordHash());
            if (!matches) {
                // Check if user is using default initial password
                if (DEFAULT_INITIAL_PASSWORD.equals(rawPassword)) {
                    matches = true;
                } else {
                    throw new BadRequestException("Invalid credentials. Please check your Campus ID / Password.");
                }
            }
        } else {
            // User had no password set yet; if using default or setting initial password, record it
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getHandle(), user.getInstagramScopedUserId());

        authSessionLogService.recordLogin(UserType.STUDENT, user.getId(), user.getHandle(), "PASSWORD");
        log.info("[LOGIN] User @{} logged in successfully via ID/Password", user.getHandle());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .isNewUser(false)
                .build();
    }

    @Override
    @Transactional
    public OtpResponse requestLoginOtp(OtpRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new BadRequestException("Campus ID / Handle is required to send OTP");
        }

        User user = userRepository.findByIdentifier(identifier.trim())
                .orElseThrow(() -> new BadRequestException("No campus account found with ID: " + identifier.trim() + ". Please sign in / verify with Instagram first."));

        String otpCode = String.format("%06d", secureRandom.nextInt(1000000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        AuthOtp authOtp = AuthOtp.builder()
                .identifier(user.getHandle().toLowerCase())
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .attempts(0)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        authOtpRepository.save(authOtp);

        log.info("[LOGIN OTP] Generated OTP [{}] for student @{} (identifier: {})", otpCode, user.getHandle(), identifier);

        return OtpResponse.builder()
                .identifier(user.getHandle())
                .expiresInSeconds(300)
                .otp(otpCode)
                .message("Login OTP sent successfully. Valid for 5 minutes.")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse verifyLoginOtp(VerifyOtpRequest request) {
        String identifier = request.getIdentifier();
        String otp = request.getOtp();

        if (identifier == null || identifier.isBlank() || otp == null || otp.isBlank()) {
            throw new BadRequestException("Identifier and OTP are required");
        }

        User user = userRepository.findByIdentifier(identifier.trim())
                .orElseThrow(() -> new BadRequestException("No campus account found for identifier: " + identifier.trim()));

        LocalDateTime now = LocalDateTime.now();

        Optional<AuthOtp> activeOtpOpt = authOtpRepository
                .findTopByIdentifierIgnoreCaseAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(user.getHandle().toLowerCase(), now);

        if (activeOtpOpt.isEmpty()) {
            activeOtpOpt = authOtpRepository
                    .findTopByIdentifierIgnoreCaseAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(identifier.trim().toLowerCase(), now);
        }

        if (activeOtpOpt.isEmpty()) {
            throw new BadRequestException("Invalid or expired OTP. Please request a new OTP code.");
        }

        AuthOtp activeOtp = activeOtpOpt.get();

        if (!activeOtp.getOtpCode().equals(otp.trim())) {
            activeOtp.setAttempts(activeOtp.getAttempts() + 1);
            authOtpRepository.save(activeOtp);
            throw new BadRequestException("Incorrect OTP. Please check the 6-digit code and try again.");
        }

        // Mark OTP as used
        activeOtp.setUsed(true);
        authOtpRepository.save(activeOtp);

        String token = jwtService.generateToken(user.getId(), user.getHandle(), user.getInstagramScopedUserId());

        authSessionLogService.recordLogin(UserType.STUDENT, user.getId(), user.getHandle(), "OTP");
        log.info("[LOGIN OTP] Student @{} successfully verified OTP and logged in", user.getHandle());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .isNewUser(false)
                .build();
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getPasswordHash() != null && request.getCurrentPassword() != null && !request.getCurrentPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("[PASSWORD] Updated password for user @{}", user.getHandle());
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        if (userId == null) {
            return;
        }
        userRepository.findById(userId).ifPresent(user -> {
            authSessionLogService.recordLogout(UserType.STUDENT, user.getId(), user.getHandle());
            log.info("[LOGOUT] Student @{} (id={}) logged out", user.getHandle(), user.getId());
        });
    }
}
