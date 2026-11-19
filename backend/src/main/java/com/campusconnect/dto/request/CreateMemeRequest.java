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
@Schema(description = "Request body for posting a meme")
public class CreateMemeRequest {

    @Schema(description = "Author user ID", example = "1")
    private Long authorId;

    @NotBlank(message = "Meme image URL or path is required")
    @Schema(description = "Meme image URL", example = "http://localhost:8080/api/upload/image/meme1.jpg")
    private String imageUrl;

    @NotBlank(message = "Meme caption is required")
    @Schema(description = "Meme punchline / caption", example = "When professor says this will definitely be on the exam 💀")
    private String caption;

    @Schema(description = "Meme category tag", example = "Exams & Viva")
    private String category;
}
