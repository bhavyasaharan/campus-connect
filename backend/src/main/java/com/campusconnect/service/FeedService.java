package com.campusconnect.service;

import com.campusconnect.dto.request.CreateMomentRequest;
import com.campusconnect.dto.response.FeedPostResponse;

import java.util.List;

public interface FeedService {
    FeedPostResponse createMoment(CreateMomentRequest request);
    List<FeedPostResponse> getAllMoments();
    FeedPostResponse likeMoment(Long id);
}
