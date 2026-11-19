package com.campusconnect.service;

import com.campusconnect.dto.request.CreateMemeRequest;
import com.campusconnect.dto.response.CampusMemeResponse;

import java.util.List;

public interface MemeService {
    CampusMemeResponse createMeme(CreateMemeRequest request, Long currentUserId);
    List<CampusMemeResponse> getAllMemes(String category);
    List<CampusMemeResponse> getAllMemes(String category, Long currentUserId);
    CampusMemeResponse reactMeme(Long memeId);
    CampusMemeResponse reactMeme(Long memeId, Long currentUserId);
    void deleteMeme(Long memeId, Long currentUserId);
}
