package com.campusconnect.controller;

import com.campusconnect.dto.request.CreateMomentRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.FeedPostResponse;
import com.campusconnect.service.FeedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moments")
@RequiredArgsConstructor
@Tag(name = "Campus Moments (Feed)", description = "Endpoints for discovering, posting, and liking campus moments and stories")
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    @Operation(summary = "Get all campus moments", description = "Retrieves all photo moments shared by students on the campus wall in reverse chronological order.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Moments feed retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<FeedPostResponse>>> getAllMoments() {
        List<FeedPostResponse> moments = feedService.getAllMoments();
        return ResponseEntity.ok(ApiResponse.ok(moments));
    }

    @PostMapping
    @Operation(summary = "Post a new campus moment", description = "Publishes a new photo post with caption to the campus community feed.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Moment created and posted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid image URL or caption")
    })
    public ResponseEntity<ApiResponse<FeedPostResponse>> createMoment(
            @Valid @RequestBody CreateMomentRequest request) {
        FeedPostResponse created = feedService.createMoment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Moment posted to campus wall", created));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Like or unlike a moment", description = "Toggles like interaction and increments like counter on a specific moment post.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Moment like status updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Moment not found")
    })
    public ResponseEntity<ApiResponse<FeedPostResponse>> likeMoment(
            @Parameter(description = "Moment post ID", example = "1") @PathVariable Long id) {
        FeedPostResponse liked = feedService.likeMoment(id);
        return ResponseEntity.ok(ApiResponse.ok(liked));
    }
}
