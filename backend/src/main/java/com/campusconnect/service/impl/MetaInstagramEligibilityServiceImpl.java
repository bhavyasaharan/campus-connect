package com.campusconnect.service.impl;

import com.campusconnect.client.MetaInstagramApiClient;
import com.campusconnect.config.MetaInstagramProperties;
import com.campusconnect.service.InstagramEligibilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetaInstagramEligibilityServiceImpl implements InstagramEligibilityService {

    private final MetaInstagramApiClient apiClient;
    private final MetaInstagramProperties properties;

    @Override
    public EligibilityResult verifyFollowerEligibility(String instagramScopedUserId, String claimedUsername) {
        // Safe development mode handling
        if (properties.isDevMode() && (properties.getAccessToken() == null || properties.getAccessToken().isBlank())) {
            log.warn("[DEV MODE] Live Meta API follower check is currently in development mode for user @{}", claimedUsername);

            // Test convention for safe local testing:
            // Usernames ending with _nonfollower simulate non-followers
            if (claimedUsername != null && claimedUsername.toLowerCase().endsWith("_nonfollower")) {
                return new EligibilityResult(
                        false,
                        true,
                        "[DEV MODE] Simulated non-follower account test",
                        "NOT_FOLLOWING"
                );
            }

            return new EligibilityResult(
                    true,
                    true,
                    "[DEV MODE] Follower verification approved in dev test mode. Set META_INSTAGRAM_DEV_MODE=false with valid Meta App credentials for live Meta verification.",
                    "DEV_APPROVED"
            );
        }

        // Live Meta Graph API query
        Optional<MetaInstagramApiClient.InstagramUserProfile> profileOpt = apiClient.getUserProfile(instagramScopedUserId);

        if (profileOpt.isEmpty()) {
            return new EligibilityResult(
                    false,
                    false,
                    "Failed to fetch profile from Meta Graph API. Verify META_INSTAGRAM_ACCESS_TOKEN and network connectivity.",
                    "API_ERROR"
            );
        }

        MetaInstagramApiClient.InstagramUserProfile profile = profileOpt.get();

        if (profile.getIsUserFollowBusiness() != null) {
            boolean isFollower = Boolean.TRUE.equals(profile.getIsUserFollowBusiness());
            log.info("Live Meta follower status for @{} (IGSID: {}): {}", claimedUsername, instagramScopedUserId, isFollower);
            return new EligibilityResult(
                    isFollower,
                    true,
                    null,
                    isFollower ? "FOLLOWING" : "NOT_FOLLOWING"
            );
        }

        // Field is unavailable from Meta
        String limitationMessage = "Meta API limitation: The 'is_user_follow_business' field was not returned by Meta Graph API. " +
                "Requirements: 1) App Review approved for 'instagram_manage_messages' (Live mode), " +
                "2) Business/Creator Instagram Account connected to a Facebook Page, " +
                "3) User has messaged the Business account directly.";

        log.warn("Follower status field unavailable for IGSID {}: {}", instagramScopedUserId, limitationMessage);

        return new EligibilityResult(
                false,
                false,
                limitationMessage,
                "FIELD_UNAVAILABLE"
        );
    }
}
