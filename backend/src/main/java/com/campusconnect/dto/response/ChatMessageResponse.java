package com.campusconnect.dto.response;

import com.campusconnect.model.ChatMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Chat message representation")
public class ChatMessageResponse {

    @Schema(description = "Message ID", example = "1001")
    private Long id;

    @Schema(description = "Connection ID", example = "501")
    private Long connectionId;

    @Schema(description = "Sender user ID", example = "1")
    private Long senderId;

    @Schema(description = "Sender display name", example = "Alex Rivers")
    private String senderName;

    @Schema(description = "Message text content", example = "Hey Sophia! Are you attending the campus design showcase?")
    private String content;

    @Schema(description = "Timestamp when message was sent")
    private LocalDateTime sentAt;

    @Schema(description = "Timestamp when message was read by recipient")
    private LocalDateTime readAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        if (message == null) return null;
        return ChatMessageResponse.builder()
                .id(message.getId())
                .connectionId(message.getConnection() != null ? message.getConnection().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getDisplayName() : null)
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .readAt(message.getReadAt())
                .build();
    }
}
