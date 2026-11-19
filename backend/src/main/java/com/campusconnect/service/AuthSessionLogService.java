package com.campusconnect.service;

import com.campusconnect.dto.response.AuthSessionLogResponse;
import com.campusconnect.model.AuthActivityType;
import com.campusconnect.model.UserType;

import java.util.List;

public interface AuthSessionLogService {

    void recordLogin(UserType userType, Long userId, String identifier, String loginMethod);

    void recordLogout(UserType userType, Long userId, String identifier);

    void recordActivity(
            UserType userType,
            Long userId,
            String identifier,
            AuthActivityType activityType,
            String loginMethod,
            String status,
            String details
    );

    List<AuthSessionLogResponse> getRecentSessionLogs();

    List<AuthSessionLogResponse> getUserSessionLogs(UserType userType, Long userId);
}
