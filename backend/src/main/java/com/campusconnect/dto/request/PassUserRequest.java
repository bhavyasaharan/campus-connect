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
@Schema(description = "Payload to pass on a candidate user profile in Discovery")
public class PassUserRequest {

    @Schema(description = "Current user ID who is passing (defaults to authenticated user via JWT)", example = "1")
    private Long userId;

    @NotNull(message = "passedUserId is required")
    @Schema(description = "ID of user being passed on", example = "2")
    private Long passedUserId;
}
