package com.campusconnect.service.impl;

import com.campusconnect.dto.request.CreateUserPostRequest;
import com.campusconnect.dto.request.PostMediaItemRequest;
import com.campusconnect.dto.request.UpdateUserPostRequest;
import com.campusconnect.dto.response.PostMediaItemResponse;
import com.campusconnect.dto.response.UserPostResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.PostLike;
import com.campusconnect.model.User;
import com.campusconnect.model.UserPost;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.PostLikeRepository;
import com.campusconnect.repository.UserPostRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.UserPostService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPostServiceImpl implements UserPostService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserPostRepository userPostRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final PostLikeRepository postLikeRepository;

    @Override
    @Transactional
    public UserPostResponse createPost(CreateUserPostRequest request, Long currentUserId) {
        Long authorId = request.getAuthorId() != null ? request.getAuthorId() : currentUserId;
        if (authorId == null) {
            throw new IllegalArgumentException("Author ID is required to create a profile post");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        List<PostMediaItemResponse> normalizedMedia = new ArrayList<>();
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            for (PostMediaItemRequest item : request.getMedia()) {
                if (item.getUrl() != null && !item.getUrl().isBlank()) {
                    String type = item.getType() != null && !item.getType().isBlank()
                            ? item.getType().toUpperCase()
                            : (isVideoUrl(item.getUrl()) ? "VIDEO" : "IMAGE");
                    normalizedMedia.add(new PostMediaItemResponse(item.getUrl().trim(), type));
                }
            }
        }

        String primaryImageUrl = request.getImageUrl() != null ? request.getImageUrl().trim() : null;
        if ((primaryImageUrl == null || primaryImageUrl.isBlank()) && !normalizedMedia.isEmpty()) {
            primaryImageUrl = normalizedMedia.get(0).getUrl();
        } else if (primaryImageUrl != null && !primaryImageUrl.isBlank() && normalizedMedia.isEmpty()) {
            String type = isVideoUrl(primaryImageUrl) ? "VIDEO" : "IMAGE";
            normalizedMedia.add(new PostMediaItemResponse(primaryImageUrl, type));
        }

        if (primaryImageUrl == null || primaryImageUrl.isBlank()) {
            throw new BadRequestException("At least one photo or video is required to create a post");
        }

        String mediaUrlsJson = serializeMedia(normalizedMedia);

        UserPost post = UserPost.builder()
                .author(author)
                .imageUrl(primaryImageUrl)
                .mediaUrls(mediaUrlsJson)
                .caption(request.getCaption() != null ? request.getCaption().trim() : "")
                .build();

        UserPost saved = userPostRepository.save(post);
        return UserPostResponse.fromEntity(saved, false);
    }

    @Override
    @Transactional
    public UserPostResponse updatePost(Long postId, UpdateUserPostRequest request, Long currentUserId) {
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (currentUserId != null && !post.getAuthor().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to edit this post");
        }

        if (request.getCaption() != null) {
            post.setCaption(request.getCaption().trim());
        }

        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<PostMediaItemResponse> normalizedMedia = new ArrayList<>();
            for (PostMediaItemRequest item : request.getMedia()) {
                if (item.getUrl() != null && !item.getUrl().isBlank()) {
                    String type = item.getType() != null && !item.getType().isBlank()
                            ? item.getType().toUpperCase()
                            : (isVideoUrl(item.getUrl()) ? "VIDEO" : "IMAGE");
                    normalizedMedia.add(new PostMediaItemResponse(item.getUrl().trim(), type));
                }
            }
            if (!normalizedMedia.isEmpty()) {
                post.setMediaUrls(serializeMedia(normalizedMedia));
                post.setImageUrl(normalizedMedia.get(0).getUrl());
            }
        }

        UserPost saved = userPostRepository.save(post);
        boolean isLiked = (currentUserId != null) && postLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        return UserPostResponse.fromEntity(saved, isLiked);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserPostResponse> getUserPosts(Long userId) {
        return getUserPosts(userId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserPostResponse> getUserPosts(Long userId, Long viewerId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // If viewerId is specified and viewer is not the author, enforce that they are accepted connections
        if (viewerId != null && !viewerId.equals(userId)) {
            User viewer = userRepository.findById(viewerId).orElse(null);
            if (viewer == null || connectionRepository.findBetweenUsers(viewer, targetUser).isEmpty()) {
                // Not connected: private student posts are locked to connections only
                return List.of();
            }
        }

        List<UserPost> posts = userPostRepository.findByAuthorOrderByCreatedAtDesc(targetUser);
        Set<Long> likedPostIds = (viewerId != null)
                ? postLikeRepository.findLikedPostIdsByUserId(viewerId)
                : Set.of();

        return posts.stream()
                .map(p -> UserPostResponse.fromEntity(p, likedPostIds.contains(p.getId())))
                .toList();
    }

    @Override
    @Transactional
    public UserPostResponse likePost(Long postId) {
        return likePost(postId, null);
    }

    @Override
    @Transactional
    public UserPostResponse likePost(Long postId, Long currentUserId) {
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (currentUserId == null) {
            return UserPostResponse.fromEntity(post, false);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        boolean alreadyLiked = postLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        boolean isLiked;

        if (alreadyLiked) {
            postLikeRepository.deleteByPostIdAndUserId(postId, currentUserId);
            isLiked = false;
        } else {
            PostLike postLike = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(postLike);
            isLiked = true;
        }

        long trueLikesCount = postLikeRepository.countByPostId(postId);
        post.setLikesCount((int) trueLikesCount);
        UserPost saved = userPostRepository.save(post);

        return UserPostResponse.fromEntity(saved, isLiked);
    }

    @Override
    @Transactional
    public void deletePost(Long postId, Long currentUserId) {
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (currentUserId != null && !post.getAuthor().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to delete this post.");
        }

        userPostRepository.delete(post);
    }

    private static String serializeMedia(List<PostMediaItemResponse> media) {
        try {
            return OBJECT_MAPPER.writeValueAsString(media);
        } catch (Exception e) {
            log.error("Failed to serialize post media: {}", e.getMessage());
            return "[]";
        }
    }

    private static boolean isVideoUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") ||
               lower.endsWith(".ogg") || lower.endsWith(".m4v") || lower.contains("video/");
    }
}
