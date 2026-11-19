package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body for updating an existing student profile post")
public class UpdateUserPostRequest {

    @NotBlank(message = "Caption cannot be empty")
    @Schema(description = "Updated post caption", example = "Updated hackathon recap with new photos! 🌟")
    private String caption;

    @Schema(description = "Updated list of media items (photos and videos)")
    private List<PostMediaItemRequest> media;
}
