package com.campusconnect.service;

import com.campusconnect.dto.request.RegisterUserRequest;
import com.campusconnect.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse registerUser(RegisterUserRequest request);
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse getUserByHandle(String handle);
}
