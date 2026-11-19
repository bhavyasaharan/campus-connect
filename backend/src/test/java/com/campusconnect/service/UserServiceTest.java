package com.campusconnect.service;

import com.campusconnect.config.CampusVerificationProperties;
import com.campusconnect.dto.request.UpdateUserProfileRequest;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.Connection;
import com.campusconnect.model.StudentProfile;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.StudentProfileRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private CampusVerificationProperties verificationProperties;

    @Mock
    private ConnectionRepository connectionRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .handle("sophia_chen")
                .displayName("Sophia Chen")
                .verificationStatus(VerificationStatus.VERIFIED)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Update user profile succeeds for active user")
    void testUpdateUserProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentProfileRepository.save(any(StudentProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .displayName("Sophia C. Updated")
                .department("AI & Robotics")
                .graduationYear("2026")
                .bio("Updated bio about robotics!")
                .avatarUrl("https://example.com/new-avatar.jpg")
                .build();

        UserResponse response = userService.updateUserProfile(1L, request);

        assertNotNull(response);
        assertEquals("Sophia C. Updated", response.getDisplayName());
        assertEquals("AI & Robotics", response.getDepartment());
        assertEquals("2026", response.getGraduationYear());
        assertEquals("Updated bio about robotics!", response.getBio());
        assertEquals("https://example.com/new-avatar.jpg", response.getAvatarUrl());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Update user profile fails if user is suspended")
    void testUpdateUserProfile_Suspended() {
        user.setAccountStatus(AccountStatus.SUSPENDED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .displayName("Hacked Name")
                .build();

        assertThrows(ForbiddenException.class, () -> userService.updateUserProfile(1L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Update user profile fails if user not found")
    void testUpdateUserProfile_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .displayName("Unknown")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> userService.updateUserProfile(999L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Non-connected viewer receives sanitized user profile with contact info hidden")
    void testGetUserById_SanitizedWhenNotConnected() {
        User viewer = User.builder().id(2L).handle("alex").build();
        user.setEmail("sophia@campus.edu");
        user.setPhone("+1234567890");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findById(2L)).thenReturn(Optional.of(viewer));
        when(connectionRepository.findBetweenUsers(viewer, user)).thenReturn(Optional.empty());

        UserResponse res = userService.getUserById(1L, 2L);
        assertNotNull(res);
        assertEquals("sophia_chen", res.getHandle());
        assertNull(res.getEmail(), "Email must be masked when not connected");
        assertNull(res.getPhone(), "Phone must be masked when not connected");
    }

    @Test
    @DisplayName("Connected viewer receives complete user profile including contact info")
    void testGetUserById_CompleteWhenConnected() {
        User viewer = User.builder().id(2L).handle("alex").build();
        user.setEmail("sophia@campus.edu");
        user.setPhone("+1234567890");

        Connection conn = Connection.builder()
                .id(10L)
                .user1(viewer)
                .user2(user)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findById(2L)).thenReturn(Optional.of(viewer));
        when(connectionRepository.findBetweenUsers(viewer, user)).thenReturn(Optional.of(conn));

        UserResponse res = userService.getUserById(1L, 2L);
        assertNotNull(res);
        assertEquals("sophia_chen", res.getHandle());
        assertEquals("sophia@campus.edu", res.getEmail());
        assertEquals("+1234567890", res.getPhone());
    }
}
