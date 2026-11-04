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

        @JsonProperty("is_user_follow_business")
        private Boolean isUserFollowBusiness;
    }

    /**
     * Retrieves user profile and follower status from the official Meta Instagram Graph API.
     * GET https://graph.facebook.com/{version}/{igsid}?fields=id,name,username,profile_pic,is_user_follow_business&access_token={token}
     */
    public Optional<InstagramUserProfile> getUserProfile(String instagramScopedUserId) {
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
            URI uri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com")
                    .pathSegment(properties.getApiVersion(), instagramScopedUserId)
                    .queryParam("fields", "id,name,username,profile_pic,is_user_follow_business")
                    .queryParam("access_token", accessToken)
                    .build()
                    .toUri();

            ResponseEntity<InstagramUserProfile> response = restTemplate.getForEntity(uri, InstagramUserProfile.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of(response.getBody());
            }
        } catch (Exception e) {
            log.error("Meta Graph API request failed for IGSID {}: {}", instagramScopedUserId, e.getMessage());
        }

        return Optional.empty();
    }
}
