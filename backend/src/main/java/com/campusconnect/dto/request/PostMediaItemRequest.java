package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Media item (photo or video) for post creation or update")
public class PostMediaItemRequest {

    @NotBlank(message = "Media URL is required")
    @Schema(description = "Media URL", example = "/api/upload/image/sample.jpg")
    private String url;

    @Schema(description = "Media type: IMAGE or VIDEO", example = "IMAGE")
    private String type;
}
