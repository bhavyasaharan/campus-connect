package com.campusconnect.dto.response;

import com.campusconnect.model.AuthActivityType;
import com.campusconnect.model.AuthSessionLog;
import com.campusconnect.model.UserType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User and Admin authentication session activity record")
public class AuthSessionLogResponse {

    private Long id;
    private UserType userType;
    private Long userId;
    private String identifier;
    private AuthActivityType activityType;
    private String loginMethod;
    private String ipAddress;
    private String userAgent;
    private String status;
    private String details;
    private LocalDateTime createdAt;

    public static AuthSessionLogResponse fromEntity(AuthSessionLog entity) {
        return AuthSessionLogResponse.builder()
                .id(entity.getId())
                .userType(entity.getUserType())
                .userId(entity.getUserId())
                .identifier(entity.getIdentifier())
                .activityType(entity.getActivityType())
                .loginMethod(entity.getLoginMethod())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .status(entity.getStatus())
                .details(entity.getDetails())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
