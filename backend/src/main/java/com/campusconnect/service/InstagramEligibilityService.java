package com.campusconnect.service;

public interface InstagramEligibilityService {

    record EligibilityResult(
            boolean isFollower,
            boolean checkPerformed,
            String limitationNotice,
            String rawStatus
    ) {}

    EligibilityResult verifyFollowerEligibility(String instagramScopedUserId, String claimedUsername);
}
