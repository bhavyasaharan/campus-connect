package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to initiate an Instagram verification challenge")
public class InstagramChallengeRequest {

    @NotBlank(message = "Instagram handle cannot be blank")
    @Pattern(
        regexp = "^@?[a-zA-Z0-9._]{1,30}$",
        message = "Must be a valid Instagram username (1-30 characters, letters, numbers, periods, and underscores)"
    )
    @Schema(description = "Claimed Instagram username (with or without @)", example = "sophia_chen", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;
}
