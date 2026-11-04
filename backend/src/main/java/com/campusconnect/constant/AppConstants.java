package com.campusconnect.constant;

/**
 * Enterprise Application Constants
 * Immutable constants used across application layers.
 * Operational and environment-dependent properties are managed via {@link com.campusconnect.config.CampusVerificationProperties}.
 */
public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation of utility / constants class
    }

    // Verification & OTP Standards
    public static final int OTP_LENGTH = 6;
    public static final String OTP_REGEX_PATTERN = "\\b(\\d{6})\\b";

    // HTTP & Security Headers
    public static final String AUTH_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String SIGNATURE_HEADER = "X-Hub-Signature-256";

    // JWT Claims
    public static final String JWT_CLAIM_USERNAME = "username";
    public static final String JWT_CLAIM_IGSID = "igsid";

    // Meta Webhook Modes & Responses
    public static final String META_HUB_MODE_SUBSCRIBE = "subscribe";
    public static final String WEBHOOK_RESPONSE_EVENT_RECEIVED = "EVENT_RECEIVED";
}
