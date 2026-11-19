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
@Schema(description = "Request body for creating a student profile post with photos and videos")
public class CreateUserPostRequest {

    @Schema(description = "Author user ID", example = "1")
    private Long authorId;

    @Schema(description = "Primary media / image URL of the post", example = "http://localhost:8080/api/upload/image/post1.jpg")
    private String imageUrl;

    @NotBlank(message = "Caption is required")
    @Schema(description = "Post caption", example = "Campus hackathon project finished! 🚀")
    private String caption;

    @Schema(description = "List of media items (multiple photos and videos combined in a single post)")
    private List<PostMediaItemRequest> media;
}
