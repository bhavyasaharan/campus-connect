package com.campusconnect.controller;

import com.campusconnect.config.MetaInstagramProperties;
import com.campusconnect.security.InstagramWebhookSignatureValidator;
import com.campusconnect.service.InstagramMessagingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/instagram")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Instagram Webhooks", description = "Meta Webhook verification handshake and live message ingestion callbacks")
public class InstagramWebhookController {

    private final MetaInstagramProperties properties;
    private final InstagramWebhookSignatureValidator signatureValidator;
    private final InstagramMessagingService messagingService;
    private final ObjectMapper objectMapper;

    /**
     * Meta Webhook Verification Endpoint (GET).
     * Meta sends a GET request to verify ownership of the webhook URL during subscription setup.
     */
    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Meta Webhook verification handshake (GET)", description = "Handles the initial hub challenge handshake from Meta Graph API when registering the Instagram webhook subscription.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Webhook challenge echoed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Invalid verify token or subscription mode")
    })
    public ResponseEntity<String> verifyWebhook(
            @Parameter(description = "Meta hub mode", example = "subscribe") @RequestParam(value = "hub.mode", required = false) String mode,
            @Parameter(description = "Configured webhook verify token") @RequestParam(value = "hub.verify_token", required = false) String verifyToken,
            @Parameter(description = "Challenge string from Meta to echo") @RequestParam(value = "hub.challenge", required = false) String challenge
    ) {
        log.info("Received Meta webhook verification handshake: mode={}, token={}", mode, verifyToken);

        String configuredToken = properties.getWebhookVerifyToken();

        if ("subscribe".equals(mode) && configuredToken != null && configuredToken.equals(verifyToken)) {
            log.info("Meta webhook verification handshake successful!");
            return ResponseEntity.ok(challenge);
        }

        log.warn("Meta webhook verification failed: token mismatch or invalid mode.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
    }

    /**
     * Meta Webhook Event Ingestion Endpoint (POST).
     * Receives live messaging events from Instagram users when they send Direct Messages.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Meta Webhook event callback (POST)", description = "Ingests live incoming messaging events from Instagram Direct, verifies X-Hub-Signature-256 HMAC-SHA256 signature, and dispatches messages.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Event received and acknowledged (EVENT_RECEIVED)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Invalid signature header")
    })
    public ResponseEntity<String> handleWebhookEvent(
            @Parameter(description = "HMAC-SHA256 signature of request body", example = "sha256=d3b07384d113edec49eaa6238ad5ff00")
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signatureHeader,
            @RequestBody byte[] rawPayload
    ) {
        // 1. Verify HMAC-SHA256 signature
        if (!signatureValidator.isValidSignature(rawPayload, signatureHeader)) {
            log.warn("Rejecting Meta webhook: Invalid X-Hub-Signature-256 signature.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid signature");
        }

        // 2. Parse and process messaging events asynchronously / service delegation
        try {
            JsonNode payloadJson = objectMapper.readTree(rawPayload);
            messagingService.handleWebhookEvent(payloadJson);
        } catch (Exception e) {
            log.error("Failed to parse Meta webhook payload: {}", e.getMessage());
        }

        // Meta requires an immediate 200 OK response to prevent retries
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
