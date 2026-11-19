package com.campusconnect.service;

import com.campusconnect.dto.request.BlockUserRequest;
import com.campusconnect.dto.request.ReportUserRequest;
import com.campusconnect.dto.request.UnblockUserRequest;
import com.campusconnect.dto.response.BlockedUserResponse;
import com.campusconnect.dto.response.ReportResponse;

import java.util.List;

public interface UserSafetyService {
    void blockUser(BlockUserRequest requestDto);
    void unblockUser(UnblockUserRequest requestDto);
    List<BlockedUserResponse> getBlockedUsers(Long userId);
    ReportResponse reportUser(ReportUserRequest requestDto);
    boolean isBlockedBetween(Long user1Id, Long user2Id);
}
