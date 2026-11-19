package com.campusconnect.dto.response;

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
@Schema(description = "Blocked student response entry")
public class BlockedUserResponse {

    @Schema(description = "Block record ID", example = "1")
    private Long id;

    @Schema(description = "Blocked student profile")
    private UserResponse blockedUser;

    @Schema(description = "Reason given for block", example = "Spam")
    private String reason;

    @Schema(description = "Timestamp when user was blocked")
    private LocalDateTime blockedAt;
}
