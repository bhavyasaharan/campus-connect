package com.campusconnect.security;

import com.campusconnect.config.MetaInstagramProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
@RequiredArgsConstructor
@Slf4j
public class InstagramWebhookSignatureValidator {

    private final MetaInstagramProperties properties;

    /**
     * Validates X-Hub-Signature-256 header sent by Meta Webhooks.
     *
     * @param payloadRaw raw JSON body bytes
     * @param signatureHeader value of X-Hub-Signature-256 (e.g. "sha256=abcdef...")
     * @return true if valid, false otherwise
     */
    public boolean isValidSignature(byte[] payloadRaw, String signatureHeader) {
        String appSecret = properties.getAppSecret();

        if (properties.isDevMode() && (appSecret == null || appSecret.isBlank())) {
            log.warn("Meta App Secret not configured in dev mode. Skipping signature verification for local testing.");
            return true;
        }

        if (signatureHeader == null || !signatureHeader.startsWith("sha256=") || appSecret == null || appSecret.isBlank()) {
            log.warn("Missing or malformed X-Hub-Signature-256 header");
            return false;
        }

        try {
            String expectedHash = signatureHeader.substring("sha256=".length()).trim();

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(payloadRaw);
            String calculatedHash = HexFormat.of().formatHex(hmacBytes);

            return MessageDigest.isEqual(
                    calculatedHash.getBytes(StandardCharsets.UTF_8),
                    expectedHash.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Failed to verify Meta webhook signature: {}", e.getMessage());
            return false;
        }
    }
}
