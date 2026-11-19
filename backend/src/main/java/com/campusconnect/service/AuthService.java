package com.campusconnect.service;

import com.campusconnect.dto.request.ChangePasswordRequest;
import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.OtpRequest;
import com.campusconnect.dto.request.VerifyOtpRequest;
import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.dto.response.OtpResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    OtpResponse requestLoginOtp(OtpRequest request);
    AuthResponse verifyLoginOtp(VerifyOtpRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    void logout(Long userId);
}
