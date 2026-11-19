package com.campusconnect.service.impl;

import com.campusconnect.client.MetaInstagramApiClient;
import com.campusconnect.config.MetaInstagramProperties;
import com.campusconnect.service.InstagramEligibilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetaInstagramEligibilityServiceImpl implements InstagramEligibilityService {

    private final MetaInstagramApiClient apiClient;
    private final MetaInstagramProperties properties;

    @Override
    public EligibilityResult verifyFollowerEligibility(String instagramScopedUserId, String claimedUsername) {
        log.info("Follower eligibility check bypassed for @{} (IGSID: {})", claimedUsername, instagramScopedUserId);
        return new EligibilityResult(
                true,
                true,
                null,
                "VERIFIED"
        );
    }
}
