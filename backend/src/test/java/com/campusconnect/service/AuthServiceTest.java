package com.campusconnect.service;

import com.campusconnect.dto.request.ChangePasswordRequest;
import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.OtpRequest;
import com.campusconnect.dto.request.VerifyOtpRequest;
import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.OtpResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.model.AuthOtp;
import com.campusconnect.model.User;
import com.campusconnect.model.UserType;
import com.campusconnect.repository.AuthOtpRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthOtpRepository authOtpRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthSessionLogService authSessionLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .handle("alex_campus")
                .displayName("Alex Rivers")
                .passwordHash("$2a$10$hashedPassword")
                .instagramScopedUserId("igsid_alex")
                .build();
    }

    @Test
    @DisplayName("Should successfully login with valid ID and Password")
    void shouldLoginWithValidIdAndPassword() {
        when(userRepository.findByIdentifier("alex_campus")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("ValidPassword123", "$2a$10$hashedPassword")).thenReturn(true);
        when(jwtService.generateToken(1L, "alex_campus", "igsid_alex")).thenReturn("mock-jwt-token");

        LoginRequest request = LoginRequest.builder()
                .identifier("alex_campus")
                .password("ValidPassword123")
                .build();

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getUser().getHandle()).isEqualTo("alex_campus");
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void shouldRejectInvalidPassword() {
        when(userRepository.findByIdentifier("alex_campus")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$hashedPassword")).thenReturn(false);

        LoginRequest request = LoginRequest.builder()
                .identifier("alex_campus")
                .password("WrongPassword")
                .build();

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("Should request login OTP successfully")
    void shouldRequestLoginOtpSuccessfully() {
        when(userRepository.findByIdentifier("alex_campus")).thenReturn(Optional.of(sampleUser));
        when(authOtpRepository.save(any(AuthOtp.class))).thenAnswer(i -> i.getArgument(0));

        OtpRequest request = OtpRequest.builder()
                .identifier("alex_campus")
                .build();

        OtpResponse response = authService.requestLoginOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getIdentifier()).isEqualTo("alex_campus");
        assertThat(response.getOtp()).hasSize(6);
        verify(authOtpRepository, times(1)).save(any(AuthOtp.class));
    }

    @Test
    @DisplayName("Should verify valid login OTP and return JWT")
    void shouldVerifyOtpAndLogin() {
        when(userRepository.findByIdentifier("alex_campus")).thenReturn(Optional.of(sampleUser));

        AuthOtp activeOtp = AuthOtp.builder()
                .id(10L)
                .identifier("alex_campus")
                .otpCode("481923")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .attempts(0)
                .build();

        when(authOtpRepository.findTopByIdentifierIgnoreCaseAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(eq("alex_campus"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(activeOtp));
        when(jwtService.generateToken(1L, "alex_campus", "igsid_alex")).thenReturn("mock-jwt-token-otp");

        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .identifier("alex_campus")
                .otp("481923")
                .build();

        AuthResponse response = authService.verifyLoginOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token-otp");
        assertThat(activeOtp.getUsed()).isTrue();
        verify(authOtpRepository, times(1)).save(activeOtp);
    }

    @Test
    @DisplayName("Should change user password successfully")
    void shouldChangePassword() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("OldPassword", "$2a$10$hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("NewSecretPassword")).thenReturn("$2a$10$newHashedPassword");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword")
                .newPassword("NewSecretPassword")
                .build();

        authService.changePassword(1L, request);

        assertThat(sampleUser.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Should record logout for authenticated student")
    void shouldLogoutStudent() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        authService.logout(1L);

        verify(authSessionLogService, times(1)).recordLogout(UserType.STUDENT, 1L, "alex_campus");
    }
}
