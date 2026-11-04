package com.campusconnect.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Type-Safe Configuration Properties for Campus Verification & Security Policies.
 * Follows Spring Boot enterprise standards: externalized, validated, and environment-configurable.
 */
@Configuration
@ConfigurationProperties(prefix = "campus.verification")
@Validated
@Data
public class CampusVerificationProperties {

    /**
     * Duration in minutes before an issued Instagram DM OTP code expires.
     */
    @Min(value = 1, message = "OTP expiry must be at least 1 minute")
    private int otpExpiryMinutes = 5;

    /**
     * Cooldown period in seconds before a user can request an OTP resend.
     */
    @Min(value = 5, message = "Resend cooldown must be at least 5 seconds")
    private int resendCooldownSeconds = 60;

    /**
     * Maximum allowed incorrect verification attempts before a challenge is locked out.
     */
    @Min(value = 1, message = "Max verification attempts must be at least 1")
    private int maxVerificationAttempts = 5;

    /**
     * Initial grace period in hours granted to newly registered student accounts.
     */
    @Min(value = 1, message = "Grace period must be at least 1 hour")
    private int gracePeriodHours = 24;

    /**
     * Designated official Instagram community account handle to verify followers against.
     */
    @NotBlank(message = "Target social account is required")
    private String targetSocialAccount = "campus_connect_official";

    /**
     * Directory path where uploaded follower sync JSON exports are stored.
     */
    private String exportDirectory = "uploads/follower-sync";
}
