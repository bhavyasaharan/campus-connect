package com.campusconnect.service.impl;

import com.campusconnect.dto.request.CreateMemeRequest;
import com.campusconnect.dto.response.CampusMemeResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.CampusMeme;
import com.campusconnect.model.User;
import com.campusconnect.model.MemeLike;
import com.campusconnect.repository.CampusMemeRepository;
import com.campusconnect.repository.MemeLikeRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.MemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MemeServiceImpl implements MemeService {

    private final CampusMemeRepository campusMemeRepository;
    private final UserRepository userRepository;
    private final MemeLikeRepository memeLikeRepository;

    @Override
    @Transactional
    public CampusMemeResponse createMeme(CreateMemeRequest request, Long currentUserId) {
        Long authorId = request.getAuthorId() != null ? request.getAuthorId() : currentUserId;
        if (authorId == null) {
            throw new IllegalArgumentException("Author ID is required to create a meme");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + authorId));

        String category = request.getCategory() != null && !request.getCategory().isBlank()
                ? request.getCategory().trim()
                : "All Memes";

        CampusMeme meme = CampusMeme.builder()
                .author(author)
                .imageUrl(request.getImageUrl().trim())
                .caption(request.getCaption().trim())
                .category(category)
                .build();

        CampusMeme saved = campusMemeRepository.save(meme);
        return CampusMemeResponse.fromEntity(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampusMemeResponse> getAllMemes(String category) {
        return getAllMemes(category, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampusMemeResponse> getAllMemes(String category, Long currentUserId) {
        List<CampusMeme> list;
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("All Memes")) {
            list = campusMemeRepository.findByCategoryOrderByCreatedAtDesc(category.trim());
        } else {
            list = campusMemeRepository.findAllByOrderByCreatedAtDesc();
        }

        Set<Long> likedMemeIds = (currentUserId != null)
                ? memeLikeRepository.findLikedMemeIdsByUserId(currentUserId)
                : Set.of();

        return list.stream()
                .map(m -> CampusMemeResponse.fromEntity(m, likedMemeIds.contains(m.getId())))
                .toList();
    }

    @Override
    @Transactional
    public CampusMemeResponse reactMeme(Long memeId) {
        return reactMeme(memeId, null);
    }

    @Override
    @Transactional
    public CampusMemeResponse reactMeme(Long memeId, Long currentUserId) {
        CampusMeme meme = campusMemeRepository.findById(memeId)
                .orElseThrow(() -> new ResourceNotFoundException("Meme not found with id: " + memeId));

        if (currentUserId == null) {
            return CampusMemeResponse.fromEntity(meme, false);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        boolean alreadyLiked = memeLikeRepository.existsByMemeIdAndUserId(memeId, currentUserId);
        boolean isLiked;

        if (alreadyLiked) {
            // Already liked -> unlike (remove like record & decrement)
            memeLikeRepository.deleteByMemeIdAndUserId(memeId, currentUserId);
            isLiked = false;
        } else {
            // First time like by this user -> like (1 user = 1 like)
            MemeLike like = MemeLike.builder()
                    .meme(meme)
                    .user(user)
                    .build();
            memeLikeRepository.save(like);
            isLiked = true;
        }

        long trueLikesCount = memeLikeRepository.countByMemeId(memeId);
        meme.setLikesCount((int) trueLikesCount);
        CampusMeme saved = campusMemeRepository.save(meme);

        return CampusMemeResponse.fromEntity(saved, isLiked);
    }

    @Override
    @Transactional
    public void deleteMeme(Long memeId, Long currentUserId) {
        CampusMeme meme = campusMemeRepository.findById(memeId)
                .orElseThrow(() -> new ResourceNotFoundException("Meme not found with id: " + memeId));

        if (currentUserId != null && !meme.getAuthor().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to delete this meme.");
        }

        campusMemeRepository.delete(meme);
    }
}
