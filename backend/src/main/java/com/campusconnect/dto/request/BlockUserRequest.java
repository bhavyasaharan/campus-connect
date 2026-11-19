package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload to block a student")
public class BlockUserRequest {

    @Schema(description = "Current authenticated user ID (defaults to authenticated user via JWT)", example = "1")
    private Long blockerId;

    @NotNull(message = "blockedId is required")
    @Schema(description = "ID of user to block", example = "2")
    private Long blockedId;

    @Schema(description = "Optional reason for block", example = "Unwanted behavior or harassment")
    private String reason;
}
