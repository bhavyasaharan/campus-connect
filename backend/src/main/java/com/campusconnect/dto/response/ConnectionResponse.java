package com.campusconnect.dto.response;

import com.campusconnect.model.Connection;
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
@Schema(description = "Mutual accepted connection details")
public class ConnectionResponse {

    @Schema(description = "Connection ID", example = "501")
    private Long id;

    @Schema(description = "Peer student profile")
    private UserResponse peerUser;

    @Schema(description = "Originating connect request ID", example = "101")
    private Long originRequestId;

    @Schema(description = "Timestamp when connection was formed")
    private LocalDateTime connectedAt;

    @Schema(description = "Timestamp of the most recent message or interaction")
    private LocalDateTime lastInteractionAt;

    public static ConnectionResponse fromEntity(Connection connection, Long currentUserId) {
        if (connection == null) return null;
        // Determine which participant is the other peer
        UserResponse peer = connection.getUser1().getId().equals(currentUserId)
                ? UserResponse.fromEntity(connection.getUser2())
                : UserResponse.fromEntity(connection.getUser1());

        return ConnectionResponse.builder()
                .id(connection.getId())
                .peerUser(peer)
                .originRequestId(connection.getOriginRequest() != null ? connection.getOriginRequest().getId() : null)
                .connectedAt(connection.getConnectedAt())
                .lastInteractionAt(connection.getLastInteractionAt())
                .build();
    }
}
