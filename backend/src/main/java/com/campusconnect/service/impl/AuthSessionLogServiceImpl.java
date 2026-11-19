package com.campusconnect.service.impl;

import com.campusconnect.dto.response.AuthSessionLogResponse;
import com.campusconnect.model.AuthActivityType;
import com.campusconnect.model.AuthSessionLog;
import com.campusconnect.model.UserType;
import com.campusconnect.repository.AuthSessionLogRepository;
import com.campusconnect.service.AuthSessionLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthSessionLogServiceImpl implements AuthSessionLogService {

    private final AuthSessionLogRepository sessionLogRepository;

    @Override
    @Transactional
    public void recordLogin(UserType userType, Long userId, String identifier, String loginMethod) {
        recordActivity(userType, userId, identifier, AuthActivityType.LOGIN, loginMethod, "SUCCESS", null);
    }

    @Override
    @Transactional
    public void recordLogout(UserType userType, Long userId, String identifier) {
        recordActivity(userType, userId, identifier, AuthActivityType.LOGOUT, null, "SUCCESS", null);
    }

    @Override
    @Transactional
    public void recordActivity(
            UserType userType,
            Long userId,
            String identifier,
            AuthActivityType activityType,
            String loginMethod,
            String status,
            String details
    ) {
        try {
            HttpServletRequest request = getCurrentHttpRequest();
            String ipAddress = request != null ? extractClientIp(request) : null;
            String userAgent = request != null ? extractUserAgent(request) : null;

            AuthSessionLog logEntry = AuthSessionLog.builder()
                    .userType(userType)
                    .userId(userId)
                    .identifier(identifier)
                    .activityType(activityType)
                    .loginMethod(loginMethod)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status(status != null ? status : "SUCCESS")
                    .details(details)
                    .build();

            sessionLogRepository.save(logEntry);
            log.info("[AUTH_LOG] Recorded {} for {} ({}, id={}) from IP {}",
                    activityType, userType, identifier, userId, ipAddress);
        } catch (Exception e) {
            log.error("[AUTH_LOG] Failed to record session activity log: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuthSessionLogResponse> getRecentSessionLogs() {
        return sessionLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100))
                .stream()
                .map(AuthSessionLogResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuthSessionLogResponse> getUserSessionLogs(UserType userType, Long userId) {
        return sessionLogRepository.findByUserTypeAndUserIdOrderByCreatedAtDesc(userType, userId)
                .stream()
                .map(AuthSessionLogResponse::fromEntity)
                .toList();
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
        if (attribs instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes.getRequest();
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String extractUserAgent(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 250) {
            return ua.substring(0, 250);
        }
        return ua;
    }
}
