package com.campusconnect.service.impl;

import com.campusconnect.config.CampusVerificationProperties;
import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CampusVerificationProperties verificationProperties;

    @Override
    @Transactional
    public UserResponse registerUser(RegisterUserRequest request) {
        String cleanHandle = request.getHandle().replace("@", "").toLowerCase().trim();

        if (userRepository.findByHandleIgnoreCase(cleanHandle).isPresent()) {
            throw new BadRequestException("Campus handle @" + cleanHandle + " is already registered.");
        }

        User user = User.builder()
                .handle(cleanHandle)
                .displayName(request.getDisplayName().trim())
                .department(request.getDepartment())
                .graduationYear(request.getGraduationYear())
                .bio(request.getBio())
                .avatarUrl(request.getAvatarUrl())
                .verificationStatus(VerificationStatus.GRACE_PERIOD)
                .gracePeriodExpiresAt(LocalDateTime.now().plusHours(verificationProperties.getGracePeriodHours()))
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByHandle(String handle) {
        String clean = handle.replace("@", "").toLowerCase().trim();
        return userRepository.findByHandleIgnoreCase(clean)
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for handle: @" + clean));
    }
}
