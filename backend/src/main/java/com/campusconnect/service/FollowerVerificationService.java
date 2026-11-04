package com.campusconnect.service;

import com.campusconnect.dto.response.FollowerSyncResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.model.FollowerSyncLog;
import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import com.campusconnect.repository.FollowerSyncLogRepository;
import com.campusconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowerVerificationService {

    private final UserRepository userRepository;
    private final FollowerSyncLogRepository syncLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Parses the Instagram JSON export stream and returns a set of lowercase follower handles.
     */
    public Set<String> parseFollowersJson(InputStream inputStream) {
        Set<String> handles = new HashSet<>();
        try {
            JsonNode root = objectMapper.readTree(inputStream);

            if (root.isArray()) {
                for (JsonNode item : root) {
                    extractHandlesFromNode(item, handles);
                }
            } else if (root.has("relationships_followers")) {
                JsonNode list = root.get("relationships_followers");
                if (list.isArray()) {
                    for (JsonNode item : list) {
                        extractHandlesFromNode(item, handles);
                    }
                }
            } else {
                extractHandlesFromNode(root, handles);
            }
        } catch (Exception e) {
            log.error("Failed to parse followers JSON: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid Instagram export JSON format: " + e.getMessage());
        }
        return handles;
    }

    private void extractHandlesFromNode(JsonNode node, Set<String> handles) {
        if (node.isTextual()) {
            handles.add(node.asText().toLowerCase().trim());
        } else if (node.has("string_list_data") && node.get("string_list_data").isArray()) {
            for (JsonNode data : node.get("string_list_data")) {
                if (data.has("value")) {
                    handles.add(data.get("value").asText().toLowerCase().trim());
                }
            }
        } else if (node.has("value")) {
            handles.add(node.get("value").asText().toLowerCase().trim());
        }
    }

    /**
     * Reconciles all registered users against the parsed followers list.
     */
    @Transactional
    public FollowerSyncResponse reconcileUsers(Set<String> followerHandles, String filename) {
        List<User> allUsers = userRepository.findAll();
        int verifiedCount = 0;
        int restrictedCount = 0;
        LocalDateTime now = LocalDateTime.now();

        for (User user : allUsers) {
            String handle = user.getHandle().toLowerCase().trim();

            if (followerHandles.contains(handle)) {
                user.setVerificationStatus(VerificationStatus.VERIFIED);
                user.setLastVerifiedAt(now);
                verifiedCount++;
            } else {
                if (user.getGracePeriodExpiresAt() != null && now.isBefore(user.getGracePeriodExpiresAt())) {
                    user.setVerificationStatus(VerificationStatus.GRACE_PERIOD);
                } else {
                    user.setVerificationStatus(VerificationStatus.RESTRICTED);
                    restrictedCount++;
                }
            }
        }

        userRepository.saveAll(allUsers);

        FollowerSyncLog syncLog = FollowerSyncLog.builder()
                .filename(filename)
                .totalImported(followerHandles.size())
                .verifiedCount(verifiedCount)
                .restrictedCount(restrictedCount)
                .syncedAt(now)
                .build();

        FollowerSyncLog saved = syncLogRepository.save(syncLog);
        return FollowerSyncResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<FollowerSyncResponse> getSyncLogs() {
        return syncLogRepository.findAllByOrderBySyncedAtDesc()
                .stream()
                .map(FollowerSyncResponse::fromEntity)
                .toList();
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sweepExpiredGracePeriods() {
        LocalDateTime now = LocalDateTime.now();
        List<User> graceUsers = userRepository.findByVerificationStatus(VerificationStatus.GRACE_PERIOD);

        for (User u : graceUsers) {
            if (u.getGracePeriodExpiresAt() != null && now.isAfter(u.getGracePeriodExpiresAt())) {
                u.setVerificationStatus(VerificationStatus.RESTRICTED);
                log.info("User @{} grace period expired. Status updated to RESTRICTED.", u.getHandle());
            }
        }
        userRepository.saveAll(graceUsers);
    }
}
