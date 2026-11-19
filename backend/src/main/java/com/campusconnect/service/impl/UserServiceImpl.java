package com.campusconnect.service.impl;

import com.campusconnect.config.CampusVerificationProperties;
import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.request.UpdateUserProfileRequest;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ConnectionIntent;
import com.campusconnect.model.Gender;
import com.campusconnect.model.PersonaType;
import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.StudentProfileRepository;
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
    private final StudentProfileRepository studentProfileRepository;
    private final ConnectionRepository connectionRepository;
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
                .verificationStatus(VerificationStatus.GRACE_PERIOD)
                .gracePeriodExpiresAt(LocalDateTime.now().plusHours(verificationProperties.getGracePeriodHours()))
                .build();

        User saved = userRepository.save(user);

        String initialCourse = request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim()
                : "General Studies";

        String initialGradYear = request.getGraduationYear() != null && !request.getGraduationYear().isBlank()
                ? request.getGraduationYear().trim()
                : "Class of 2026";

        StudentProfile profile = StudentProfile.builder()
                .user(saved)
                .college("Campus University")
                .course(initialCourse)
                .graduationYear(initialGradYear)
                .bio(request.getBio())
                .avatarUrl(request.getAvatarUrl())
                .interests("Student, Campus Life, Tech, Music")
                .build();
        StudentProfile savedProfile = studentProfileRepository.save(profile);

        return UserResponse.fromEntity(saved, savedProfile);
    }

    @Override
    @Transactional
    public UserResponse updateUserProfile(Long userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for id: " + userId));

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. You cannot edit your profile.");
        }

        user.setDisplayName(request.getDisplayName().trim());
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim().isEmpty() ? null : request.getEmail().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim().isEmpty() ? null : request.getPhone().trim());
        }

        StudentProfile profile = studentProfileRepository.findByUser(user)
                .orElseGet(() -> StudentProfile.builder().user(user).build());

        if (request.getCollege() != null) {
            profile.setCollege(request.getCollege().trim());
        }
        if (request.getCourse() != null) {
            profile.setCourse(request.getCourse().trim());
        } else if (request.getDepartment() != null) {
            profile.setCourse(request.getDepartment().trim());
        }

        if (request.getGraduationYear() != null) {
            profile.setGraduationYear(request.getGraduationYear().trim());
        }

        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            profile.setAvatarUrl(request.getAvatarUrl().trim());
        }

        if (request.getInterests() != null) {
            profile.setInterests(String.join(", ", request.getInterests()));
        }

        if (request.getPersonaType() != null) {
            profile.setPersonaType(PersonaType.fromString(request.getPersonaType().trim()));
        }
        if (request.getHeadline() != null) {
            profile.setHeadline(request.getHeadline().trim());
        }
        if (request.getOrganization() != null) {
            profile.setOrganization(request.getOrganization().trim());
        }
        if (request.getRoleTitle() != null) {
            profile.setRoleTitle(request.getRoleTitle().trim());
        }
        if (request.getFieldOfStudy() != null) {
            profile.setFieldOfStudy(request.getFieldOfStudy().trim());
        }
        if (request.getIsPassout() != null) {
            profile.setPassout(request.getIsPassout());
        }
        if (request.getAge() != null) {
            profile.setAge(request.getAge());
        }
        if (request.getBirthdate() != null) {
            profile.setBirthdate(request.getBirthdate());
        }
        if (request.getGender() != null) {
            profile.setGender(Gender.fromString(request.getGender().trim()));
        }
        if (request.getGenderPreference() != null) {
            profile.setGenderPreference(request.getGenderPreference().trim());
        }
        if (request.getIntent() != null) {
            profile.setIntent(ConnectionIntent.fromString(request.getIntent().trim()));
        }
        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation().trim());
        }
        if (request.getLatitude() != null) {
            profile.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            profile.setLongitude(request.getLongitude());
        }

        StudentProfile savedProfile = studentProfileRepository.save(profile);
        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser, savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    StudentProfile profile = studentProfileRepository.findByUser(u).orElse(null);
                    UserResponse res = UserResponse.fromEntity(u, profile);
                    // Public listing never exposes private contact info
                    res.setEmail(null);
                    res.setPhone(null);
                    res.setGracePeriodExpiresAt(null);
                    res.setLastVerifiedAt(null);
                    return res;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return getUserById(id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, Long viewerId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for id: " + id));
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        return sanitizeForViewer(user, profile, viewerId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByHandle(String handle) {
        return getUserByHandle(handle, null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByHandle(String handle, Long viewerId) {
        String clean = handle.replace("@", "").toLowerCase().trim();
        User user = userRepository.findByHandleIgnoreCase(clean)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for handle: @" + clean));
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        return sanitizeForViewer(user, profile, viewerId);
    }

    private UserResponse sanitizeForViewer(User targetUser, StudentProfile profile, Long viewerId) {
        UserResponse res = UserResponse.fromEntity(targetUser, profile);
        if (viewerId == null || !viewerId.equals(targetUser.getId())) {
            boolean isConnected = false;
            if (viewerId != null) {
                User viewer = userRepository.findById(viewerId).orElse(null);
                if (viewer != null) {
                    isConnected = connectionRepository.findBetweenUsers(viewer, targetUser).isPresent();
                }
            }
            if (!isConnected) {
                // Not connected: hide private contact information
                res.setEmail(null);
                res.setPhone(null);
                res.setGracePeriodExpiresAt(null);
                res.setLastVerifiedAt(null);
            }
        }
        return res;
    }
}
