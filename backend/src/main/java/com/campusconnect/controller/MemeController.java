package com.campusconnect.controller;

import com.campusconnect.dto.request.CreateMemeRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.CampusMemeResponse;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.service.MemeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/memes", "/api/moments"})
@RequiredArgsConstructor
@Tag(name = "Campus Memes", description = "Endpoints for discovering, posting, and reacting to campus memes (strictly separate from user profile posts)")
public class MemeController {

    private final MemeService memeService;

    @GetMapping
    @Operation(summary = "Get all campus memes", description = "Retrieves all memes shared in the memes section, optionally filtered by category.")
    public ResponseEntity<ApiResponse<List<CampusMemeResponse>>> getAllMemes(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long userId,
            Authentication authentication) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        List<CampusMemeResponse> memes = memeService.getAllMemes(category, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(memes));
    }

    @PostMapping
    @Operation(summary = "Post a new campus meme", description = "Publishes a new meme to the dedicated campus memes section.")
    public ResponseEntity<ApiResponse<CampusMemeResponse>> createMeme(
            @Valid @RequestBody CreateMemeRequest request) {
        Long currentUserId = SecurityUtils.resolveUserId(request.getAuthorId());
        CampusMemeResponse created = memeService.createMeme(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "React/Like a campus meme", description = "Toggles like reaction on a meme. 1 user can only like a meme once.")
    public ResponseEntity<ApiResponse<CampusMemeResponse>> likeMeme(
            @Parameter(description = "Meme ID") @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            Authentication authentication) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        CampusMemeResponse updated = memeService.reactMeme(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a meme", description = "Deletes a meme from the memes section.")
    public ResponseEntity<ApiResponse<Void>> deleteMeme(
            @Parameter(description = "Meme ID") @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        Long currentUserId = SecurityUtils.resolveUserId(userId);
        memeService.deleteMeme(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Meme deleted successfully", null));
    }
}
