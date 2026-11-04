package com.campusconnect.service.impl;

import com.campusconnect.client.MetaInstagramApiClient;
import com.campusconnect.model.ProcessedWebhookMessage;
import com.campusconnect.repository.ProcessedWebhookMessageRepository;
import com.campusconnect.service.InstagramMessagingService;
import com.campusconnect.service.InstagramVerificationService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramMessagingServiceImpl implements InstagramMessagingService {

    private final ProcessedWebhookMessageRepository messageRepository;
    private final MetaInstagramApiClient metaApiClient;
    private final InstagramVerificationService verificationService;

    @Override
    @Transactional
    public void handleWebhookEvent(JsonNode webhookPayload) {
        if (!webhookPayload.has("entry") || !webhookPayload.get("entry").isArray()) {
            return;
        }

        for (JsonNode entry : webhookPayload.get("entry")) {
            if (!entry.has("messaging") || !entry.get("messaging").isArray()) {
                continue;
            }

            for (JsonNode messaging : entry.get("messaging")) {
                processSingleMessagingEvent(messaging);
            }
        }
    }

    private void processSingleMessagingEvent(JsonNode messaging) {
        if (!messaging.has("message") || !messaging.has("sender")) {
            return;
        }

        JsonNode messageNode = messaging.get("message");
        String messageId = messageNode.has("mid") ? messageNode.get("mid").asText() : null;
        String senderIgsid = messaging.get("sender").has("id") ? messaging.get("sender").get("id").asText() : null;
        String text = messageNode.has("text") ? messageNode.get("text").asText() : null;

        if (senderIgsid == null || text == null) {
            return;
        }

        // 1. Idempotency Check: prevent duplicate webhook event processing
        if (messageId != null && messageRepository.existsByMessageId(messageId)) {
            log.info("Duplicate webhook delivery detected for message ID: {}. Skipping.", messageId);
            return;
        }

        if (messageId != null) {
            messageRepository.save(ProcessedWebhookMessage.builder()
                    .messageId(messageId)
                    .build());
        }

        // 2. Fetch official sender profile from Meta to verify actual Instagram identity
        String actualUsername = null;
        Optional<MetaInstagramApiClient.InstagramUserProfile> profileOpt = metaApiClient.getUserProfile(senderIgsid);
        if (profileOpt.isPresent() && profileOpt.get().getUsername() != null) {
            actualUsername = profileOpt.get().getUsername();
        }

        log.info("Received Instagram DM from IGSID: {}, resolved username: @{}", senderIgsid, actualUsername);

        // 3. Process verification challenge
        verificationService.processIncomingMessage(senderIgsid, actualUsername, text);
    }
}
