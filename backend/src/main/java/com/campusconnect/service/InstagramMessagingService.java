package com.campusconnect.service;

import com.fasterxml.jackson.databind.JsonNode;

public interface InstagramMessagingService {

    void handleWebhookEvent(JsonNode webhookPayload);
}
