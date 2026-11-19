package com.campusconnect.dto.response;

import com.campusconnect.model.UserPost;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
@Schema(description = "User profile post response with multi-media support")
public class UserPostResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Schema(description = "Post ID", example = "1")
    private Long id;

    @Schema(description = "Post author public summary")
    private AuthorSummaryResponse author;

    @Schema(description = "Post primary media / image URL", example = "/api/upload/image/post1.jpg")
    private String imageUrl;

    @Schema(description = "All media items in this post (images & videos combined)")
    private List<PostMediaItemResponse> media;

    @Schema(description = "Post caption", example = "Campus hackathon project finished! 🚀")
    private String caption;

    @Schema(description = "Number of likes", example = "12")
    private int likesCount;

    @Schema(description = "Post creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Post last edited timestamp")
    private LocalDateTime updatedAt;

    @Schema(description = "Whether the current user has liked this post")
    private boolean isLiked;

    public static UserPostResponse fromEntity(UserPost post, boolean isLiked) {
        if (post == null) {
            return null;
        }

        List<PostMediaItemResponse> mediaList = new ArrayList<>();
        if (post.getMediaUrls() != null && !post.getMediaUrls().isBlank()) {
            try {
                mediaList = OBJECT_MAPPER.readValue(post.getMediaUrls(), new TypeReference<List<PostMediaItemResponse>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse mediaUrls JSON for post {}: {}", post.getId(), e.getMessage());
            }
        }

        if (mediaList.isEmpty() && post.getImageUrl() != null && !post.getImageUrl().isBlank()) {
            String type = isVideoUrl(post.getImageUrl()) ? "VIDEO" : "IMAGE";
            mediaList.add(new PostMediaItemResponse(post.getImageUrl(), type));
        }

        String primaryImageUrl = post.getImageUrl();
        if ((primaryImageUrl == null || primaryImageUrl.isBlank()) && !mediaList.isEmpty()) {
            primaryImageUrl = mediaList.get(0).getUrl();
        }

        return UserPostResponse.builder()
                .id(post.getId())
                .author(AuthorSummaryResponse.fromEntity(post.getAuthor()))
                .imageUrl(primaryImageUrl)
                .media(mediaList)
                .caption(post.getCaption())
                .likesCount(post.getLikesCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .isLiked(isLiked)
                .build();
    }

    public static UserPostResponse fromEntity(UserPost post) {
        return fromEntity(post, false);
    }

    private static boolean isVideoUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") ||
               lower.endsWith(".ogg") || lower.endsWith(".m4v") || lower.contains("video/");
    }
}
