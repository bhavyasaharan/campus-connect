package com.campusconnect.dto.response;

import com.campusconnect.model.FeedPost;
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
@Schema(description = "Campus moment post representation")
public class FeedPostResponse {

    @Schema(description = "Post ID", example = "1")
    private Long id;

    @Schema(description = "Post author public summary")
    private AuthorSummaryResponse author;

    @Schema(description = "Post image URL", example = "https://images.unsplash.com/photo-1523240795612-9a054b0db644")
    private String imageUrl;

    @Schema(description = "Moment caption", example = "Sunset over the quad after final exams! 🌇✨")
    private String caption;

    @Schema(description = "Number of likes", example = "42")
    private int likesCount;

    @Schema(description = "Number of comments", example = "5")
    private int commentsCount;

    @Schema(description = "Post creation timestamp")
    private LocalDateTime createdAt;

    public static FeedPostResponse fromEntity(FeedPost post) {
        if (post == null) {
            return null;
        }
        return FeedPostResponse.builder()
                .id(post.getId())
                .author(AuthorSummaryResponse.fromEntity(post.getAuthor()))
                .imageUrl(post.getImageUrl())
                .caption(post.getCaption())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
