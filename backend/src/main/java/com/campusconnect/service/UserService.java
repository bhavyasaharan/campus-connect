package com.campusconnect.service;

import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.request.UpdateUserProfileRequest;
import com.campusconnect.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse registerUser(RegisterUserRequest request);
    UserResponse updateUserProfile(Long userId, UpdateUserProfileRequest request);
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse getUserById(Long id, Long viewerId);
    UserResponse getUserByHandle(String handle);
    UserResponse getUserByHandle(String handle, Long viewerId);
}
