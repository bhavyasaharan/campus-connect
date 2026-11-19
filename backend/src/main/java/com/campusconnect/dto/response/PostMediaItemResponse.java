package com.campusconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Individual media item (photo or video) in a user post")
public class PostMediaItemResponse {

    @Schema(description = "Media URL", example = "/api/upload/image/sample.jpg")
    private String url;

    @Schema(description = "Media type: IMAGE or VIDEO", example = "IMAGE")
    private String type;
}
