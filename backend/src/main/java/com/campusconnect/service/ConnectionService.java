package com.campusconnect.service;

import com.campusconnect.dto.request.PassUserRequest;
import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.dto.response.UserResponse;

import java.util.List;

public interface ConnectionService {
    ConnectRequestResponse sendConnectRequest(SendConnectRequest requestDto);
    ConnectionResponse acceptConnectRequest(Long requestId, Long currentUserId);
    ConnectRequestResponse declineConnectRequest(Long requestId, Long currentUserId);
    void cancelConnectRequest(Long requestId, Long currentUserId);
    List<ConnectRequestResponse> getPendingRequests(Long userId);
    List<ConnectRequestResponse> getSentRequests(Long userId);
    List<ConnectionResponse> getUserConnections(Long userId);
    void removeConnection(Long connectionId, Long currentUserId);
    void removeConnectionWithUser(Long currentUserId, Long targetUserId);
    void passUser(PassUserRequest requestDto);
    void resetPasses(Long userId);
    List<UserResponse> getDiscoveryCandidates(Long userId, boolean includePassed);
}
