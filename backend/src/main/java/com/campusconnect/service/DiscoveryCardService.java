package com.campusconnect.service;

import com.campusconnect.dto.request.UpdateDiscoverCardRequest;
import com.campusconnect.dto.response.DiscoverCardResponse;
import com.campusconnect.dto.response.ExpandedDiscoveryProfileResponse;

import java.util.List;

public interface DiscoveryCardService {
    DiscoverCardResponse getMyCard(Long currentUserId);
    DiscoverCardResponse updateMyCard(Long currentUserId, UpdateDiscoverCardRequest request);
    List<DiscoverCardResponse> getDiscoveryFeed(Long currentUserId, boolean includePassed);
    List<DiscoverCardResponse> getDiscoveryFeed(
            Long currentUserId,
            boolean includePassed,
            String mode,
            String campusStatus,
            Long collegeId,
            String college,
            Long fieldOfStudyId,
            String fieldOfStudy,
            Long companyId,
            String organization,
            String location,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Integer minAge,
            Integer maxAge,
            String gender,
            String intent);
    ExpandedDiscoveryProfileResponse getExpandedProfile(Long currentUserId, Long targetUserId);
}
