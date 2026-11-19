package com.campusconnect.websocket;

import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.model.Connection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatMessagePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Publishes a new chat message to the connection topic and user-specific message queues.
     */
    public void publishDirectMessage(Connection connection, ChatMessageResponse message) {
        if (connection == null || message == null) return;

        Long connectionId = connection.getId();
        String connectionTopic = "/topic/connections/" + connectionId + "/messages";

        log.debug("Publishing direct message to connection topic: {}", connectionTopic);
        messagingTemplate.convertAndSend(connectionTopic, message);

        // Also notify both users individually so unread badges, notifications, and conversation previews update live
        if (connection.getUser1() != null) {
            String user1Topic = "/topic/users/" + connection.getUser1().getId() + "/messages";
            messagingTemplate.convertAndSend(user1Topic, message);
        }
        if (connection.getUser2() != null) {
            String user2Topic = "/topic/users/" + connection.getUser2().getId() + "/messages";
            messagingTemplate.convertAndSend(user2Topic, message);
        }
    }

    /**
     * Publishes real-time connection acceptance notification to unlock conversation on both clients.
     */
    public void publishConnectionAccepted(Connection connection, ConnectionResponse responseUser1, ConnectionResponse responseUser2) {
        if (connection == null) return;

        if (connection.getUser1() != null && responseUser1 != null) {
            String user1Topic = "/topic/users/" + connection.getUser1().getId() + "/connections";
            messagingTemplate.convertAndSend(user1Topic, responseUser1);
        }

        if (connection.getUser2() != null && responseUser2 != null) {
            String user2Topic = "/topic/users/" + connection.getUser2().getId() + "/connections";
            messagingTemplate.convertAndSend(user2Topic, responseUser2);
        }
    }

    /**
     * Publishes read receipts when messages in a connection are marked as read.
     */
    public void publishReadReceipt(Long connectionId, Long readerUserId) {
        if (connectionId == null) return;
        String readTopic = "/topic/connections/" + connectionId + "/read";
        messagingTemplate.convertAndSend(readTopic, Map.of(
                "connectionId", connectionId,
                "readerUserId", readerUserId,
                "timestamp", System.currentTimeMillis()
        ));
    }
}
