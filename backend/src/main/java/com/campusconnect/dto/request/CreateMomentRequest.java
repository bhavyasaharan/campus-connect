package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
@Schema(description = "Request to post a new campus moment to the wall")
public class CreateMomentRequest {

    @NotNull(message = "Author ID is required")
    @Schema(description = "User ID of the author", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long authorId;

    @NotBlank(message = "Image URL is required")
    @Schema(description = "URL of the uploaded photo", example = "https://images.unsplash.com/photo-1523240795612-9a054b0db644", requiredMode = Schema.RequiredMode.REQUIRED)
    private String imageUrl;

    @NotBlank(message = "Caption is required")
    @Size(max = 1000, message = "Caption cannot exceed 1000 characters")
    @Schema(description = "Story caption or description", example = "Sunset over the quad after final exams! 🌇✨", requiredMode = Schema.RequiredMode.REQUIRED)
    private String caption;
}
