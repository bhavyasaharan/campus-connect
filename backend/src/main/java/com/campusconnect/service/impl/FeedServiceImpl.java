package com.campusconnect.service.impl;

import com.campusconnect.dto.request.CreateMomentRequest;
import com.campusconnect.dto.response.FeedPostResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.FeedPost;
import com.campusconnect.model.User;
import com.campusconnect.repository.FeedPostRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedServiceImpl implements FeedService {

    private final FeedPostRepository feedPostRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FeedPostResponse createMoment(CreateMomentRequest request) {
        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + request.getAuthorId()));

        FeedPost post = FeedPost.builder()
                .author(author)
                .imageUrl(request.getImageUrl().trim())
                .caption(request.getCaption().trim())
                .build();

        FeedPost saved = feedPostRepository.save(post);
        return FeedPostResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedPostResponse> getAllMoments() {
        return feedPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(FeedPostResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public FeedPostResponse likeMoment(Long id) {
        FeedPost post = feedPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moment not found with id: " + id));

        post.setLikesCount(post.getLikesCount() + 1);
        FeedPost saved = feedPostRepository.save(post);
        return FeedPostResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedPostResponse> getUserMoments(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return feedPostRepository.findByAuthorOrderByCreatedAtDesc(user)
                .stream()
                .map(FeedPostResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public void deleteMoment(Long id, Long userId) {
        FeedPost post = feedPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moment not found with id: " + id));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this moment.");
        }

        feedPostRepository.delete(post);
    }
}
