package com.campusconnect.dto.response;

import com.campusconnect.model.CampusMeme;
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
@Schema(description = "Campus meme representation")
public class CampusMemeResponse {

    @Schema(description = "Meme ID", example = "1")
    private Long id;

    @Schema(description = "Meme author public summary")
    private AuthorSummaryResponse author;

    @Schema(description = "Meme image URL", example = "http://localhost:8080/api/upload/image/meme1.jpg")
    private String imageUrl;

    @Schema(description = "Meme punchline / caption", example = "When professor says this will definitely be on the exam 💀")
    private String caption;

    @Schema(description = "Meme category tag", example = "Exams & Viva")
    private String category;

    @Schema(description = "Number of reacts / likes", example = "42")
    private int likesCount;

    @Schema(description = "Meme creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Whether the current user has liked this meme")
    private boolean isLiked;

    public static CampusMemeResponse fromEntity(CampusMeme meme, boolean isLiked) {
        if (meme == null) {
            return null;
        }
        return CampusMemeResponse.builder()
                .id(meme.getId())
                .author(AuthorSummaryResponse.fromEntity(meme.getAuthor()))
                .imageUrl(meme.getImageUrl())
                .caption(meme.getCaption())
                .category(meme.getCategory())
                .likesCount(meme.getLikesCount())
                .createdAt(meme.getCreatedAt())
                .isLiked(isLiked)
                .build();
    }

    public static CampusMemeResponse fromEntity(CampusMeme meme) {
        return fromEntity(meme, false);
    }
}
