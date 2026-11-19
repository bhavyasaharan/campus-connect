package com.campusconnect.service;

import com.campusconnect.dto.request.CreateUserPostRequest;
import com.campusconnect.dto.request.UpdateUserPostRequest;
import com.campusconnect.dto.response.UserPostResponse;

import java.util.List;

public interface UserPostService {
    UserPostResponse createPost(CreateUserPostRequest request, Long currentUserId);
    UserPostResponse updatePost(Long postId, UpdateUserPostRequest request, Long currentUserId);
    List<UserPostResponse> getUserPosts(Long userId);
    List<UserPostResponse> getUserPosts(Long userId, Long viewerId);
    UserPostResponse likePost(Long postId);
    UserPostResponse likePost(Long postId, Long currentUserId);
    void deletePost(Long postId, Long currentUserId);
}
