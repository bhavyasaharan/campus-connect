package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to initiate a connection with a classmate")
public class SendConnectRequest {

    @NotNull(message = "Sender ID is required")
    @Schema(description = "Student ID of the sender", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long senderId;

    @NotNull(message = "Receiver ID is required")
    @Schema(description = "Student ID of the receiver to connect with", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long receiverId;

    @Size(max = 250, message = "Note cannot exceed 250 characters")
    @Schema(description = "Optional friendly note included with connect request", example = "Loved your hackathon demo! Would love to connect.")
    private String note;
}
