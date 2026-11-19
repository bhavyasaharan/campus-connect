package com.campusconnect.dto.response;

import com.campusconnect.model.ConnectRequest;
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
@Schema(description = "Connect request details")
public class ConnectRequestResponse {

    @Schema(description = "Connect request ID", example = "101")
    private Long id;

    @Schema(description = "Sending student profile")
    private UserResponse sender;

    @Schema(description = "Target student user ID", example = "2")
    private Long receiverId;

    @Schema(description = "Target student profile")
    private UserResponse receiver;

    @Schema(description = "Intro note included with request", example = "Loved your hackathon project! Let's connect.")
    private String note;

    @Schema(description = "Request status (PENDING, ACCEPTED, DECLINED)", example = "PENDING")
    private ConnectRequest.RequestStatus status;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Response timestamp if accepted or declined")
    private LocalDateTime respondedAt;

    public static ConnectRequestResponse fromEntity(ConnectRequest request) {
        if (request == null) return null;
        return ConnectRequestResponse.builder()
                .id(request.getId())
                .sender(UserResponse.fromEntity(request.getSender()))
                .receiverId(request.getReceiver() != null ? request.getReceiver().getId() : null)
                .receiver(request.getReceiver() != null ? UserResponse.fromEntity(request.getReceiver()) : null)
                .note(request.getNote())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
    }
}
