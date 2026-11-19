package com.campusconnect.client;

import com.campusconnect.config.MetaInstagramProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class MetaInstagramApiClient {

    private final MetaInstagramProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstagramUserProfile {
        private String id;
        private String name;
        private String username;

        @JsonProperty("profile_pic")
        private String profilePic;

        @JsonProperty("profile_picture_url")
        private String profilePictureUrl;

        @JsonProperty("is_user_follow_business")
        private Boolean isUserFollowBusiness;
    }

    /**
     * Retrieves user profile and follower status from the official Meta Instagram Graph API.
     * GET https://graph.facebook.com/{version}/{igsid}?fields=id,name,username,profile_pic,is_user_follow_business&access_token={token}
     */
    public Optional<InstagramUserProfile> getUserProfile(String instagramScopedUserId) {
        if (instagramScopedUserId == null || instagramScopedUserId.isBlank()) {
            return Optional.empty();
        }

        // Handle simulated or mock IGSIDs from dev simulator without making invalid Meta Graph API calls
        if (instagramScopedUserId.startsWith("sim_") || instagramScopedUserId.startsWith("simulated_") ||
            instagramScopedUserId.startsWith("mock_") || instagramScopedUserId.startsWith("test_")) {
            log.info("[SIMULATED] Returning mock profile for simulated IGSID: {}", instagramScopedUserId);
            return Optional.of(InstagramUserProfile.builder()
                    .id(instagramScopedUserId)
                    .name("Verified Student")
                    .username("student")
                    .isUserFollowBusiness(true)
                    .build());
        }

        String accessToken = properties.getAccessToken();

        if (properties.isDevMode() && (accessToken == null || accessToken.isBlank())) {
            log.info("[DEV MODE] Meta Access Token is not set. Using dev fallback for IGSID: {}", instagramScopedUserId);
            return Optional.of(InstagramUserProfile.builder()
                    .id(instagramScopedUserId)
                    .name("Instagram User")
                    .username(null)
                    .isUserFollowBusiness(null)
                    .build());
        }

        if (accessToken == null || accessToken.isBlank()) {
            log.error("Cannot query Meta Graph API: META_INSTAGRAM_ACCESS_TOKEN is not configured.");
            return Optional.empty();
        }

        try {
            // First attempt: query with profile_picture_url and is_user_follow_business
            URI uri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com")
                    .pathSegment(properties.getApiVersion(), instagramScopedUserId)
                    .queryParam("fields", "id,name,username,profile_picture_url,is_user_follow_business")
                    .queryParam("access_token", accessToken)
                    .build()
                    .toUri();

            ResponseEntity<InstagramUserProfile> response = restTemplate.getForEntity(uri, InstagramUserProfile.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of(response.getBody());
            }
        } catch (Exception e) {
            log.warn("Meta Graph API full field query failed for IGSID {}: {}. Retrying basic fields...", instagramScopedUserId, e.getMessage());
            try {
                // Fallback attempt: query basic fields
                URI uri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com")
                        .pathSegment(properties.getApiVersion(), instagramScopedUserId)
                        .queryParam("fields", "id,name,username")
                        .queryParam("access_token", accessToken)
                        .build()
                        .toUri();

                ResponseEntity<InstagramUserProfile> response = restTemplate.getForEntity(uri, InstagramUserProfile.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return Optional.of(response.getBody());
                }
            } catch (Exception ex) {
                log.error("Meta Graph API fallback query also failed for IGSID {}: {}", instagramScopedUserId, ex.getMessage());
            }
        }

        return Optional.empty();
    }

    /**
     * Tests the live connection with Meta Graph API using the configured Access Token and Account ID.
     * Queries GET https://graph.facebook.com/{version}/{accountId}?fields=id,username,name,profile_pic&access_token={token}
     */
    public Optional<InstagramUserProfile> testConnection() {
        String accessToken = properties.getAccessToken();
        String accountId = properties.getAccountId();

        if (accessToken == null || accessToken.isBlank() || "PASTE_YOUR_ACCESS_TOKEN_HERE".equals(accessToken)) {
            log.warn("Meta Access Token is not set yet in application-local.yml.");
            return Optional.empty();
        }

        String targetId = (accountId != null && !accountId.isBlank() && !"PASTE_YOUR_ACCOUNT_ID_HERE".equals(accountId))
                ? accountId
                : "me";

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com")
                    .pathSegment(properties.getApiVersion(), targetId)
                    .queryParam("fields", "id,username,name,profile_picture_url")
                    .queryParam("access_token", accessToken)
                    .build()
                    .toUri();

            ResponseEntity<InstagramUserProfile> response = restTemplate.getForEntity(uri, InstagramUserProfile.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Meta Graph API connection test successful! Connected to account: {} ({})",
                        response.getBody().getUsername(), response.getBody().getId());
                return Optional.of(response.getBody());
            }
        } catch (Exception e) {
            log.error("Meta Graph API connection test failed: {}", e.getMessage());
        }

        return Optional.empty();
    }
}
