package com.campusconnect.controller;

import com.campusconnect.dto.request.UpdateDiscoverCardRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.DiscoverCardResponse;
import com.campusconnect.dto.response.ExpandedDiscoveryProfileResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.service.DiscoveryCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
@Tag(name = "Discovery Cards & Feed", description = "Endpoints for Discover Cards, Feed, Expanded Profiles, and Card Customization")
public class DiscoveryCardController {
    @GetMapping("/cards/{targetUserId}/expanded")
    @Operation(summary = "Get Expanded Discovery Profile", description = "Retrieves full discovery profile with swipeable photo gallery, academic info, and connection actions when a card is tapped.")
    public ResponseEntity<ApiResponse<ExpandedDiscoveryProfileResponse>> getExpandedProfile(
            @Parameter(description = "Target student user ID") @PathVariable Long targetUserId,
            @Parameter(description = "Authenticated student ID") @RequestParam(required = false) Long userId) {
        Long currentUserId = com.campusconnect.security.SecurityUtils.resolveUserId(userId);
        if (currentUserId == null) {
            throw new BadRequestException("User ID must be provided via authentication or query parameter.");
        }
        ExpandedDiscoveryProfileResponse profile = discoveryCardService.getExpandedProfile(currentUserId, targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }


    private final DiscoveryCardService discoveryCardService;

    @GetMapping("/card/me")
    @Operation(summary = "Get authenticated user's Discover Card", description = "Retrieves current student's discovery card, customizable bio, visibility preferences, and uploaded photo options.")
    public ResponseEntity<ApiResponse<DiscoverCardResponse>> getMyCard(
            @Parameter(description = "Fallback user ID if authentication header absent") @RequestParam(required = false) Long userId) {
        Long currentUserId = com.campusconnect.security.SecurityUtils.resolveUserId(userId);
        if (currentUserId == null) {
            throw new BadRequestException("User ID must be provided via authentication or query parameter.");
        }
        DiscoverCardResponse card = discoveryCardService.getMyCard(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(card));
    }

    @PutMapping("/card/me")
    @Operation(summary = "Update Discover Card customization", description = "Saves selected main photo, independent discovery bio (max 150 chars), and visibility flags without modifying main profile bio.")
    public ResponseEntity<ApiResponse<DiscoverCardResponse>> updateMyCard(
            @Valid @RequestBody UpdateDiscoverCardRequest request,
            @Parameter(description = "Fallback user ID if authentication header absent") @RequestParam(required = false) Long userId) {
        Long currentUserId = com.campusconnect.security.SecurityUtils.resolveUserId(userId);
        if (currentUserId == null) {
            throw new BadRequestException("User ID must be provided via authentication or query parameter.");
        }
        DiscoverCardResponse updated = discoveryCardService.updateMyCard(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.ok("Discover card updated successfully", updated));
    }

    @GetMapping("/feed")
    @Operation(summary = "Get Discovery cards feed", description = "Retrieves prioritized candidate discovery cards for the Discover section, excluding passed, connected, and blocked profiles, with multi-criteria filtering.")
    public ResponseEntity<ApiResponse<List<DiscoverCardResponse>>> getDiscoveryFeed(
            @Parameter(description = "Authenticated user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Whether to include previously passed profiles") @RequestParam(defaultValue = "false") boolean includePassed,
            @Parameter(description = "Discovery mode: ALL, CAMPUS, PROFESSIONAL, DATING") @RequestParam(required = false) String mode,
            @Parameter(description = "Campus status: ALL, STUDENT, PASSOUT") @RequestParam(required = false) String campusStatus,
            @Parameter(description = "Filter by college ID") @RequestParam(required = false) Long collegeId,
            @Parameter(description = "Filter by college / university name") @RequestParam(required = false) String college,
            @Parameter(description = "Filter by field of study ID") @RequestParam(required = false) Long fieldOfStudyId,
            @Parameter(description = "Filter by field of study / major name") @RequestParam(required = false) String fieldOfStudy,
            @Parameter(description = "Filter by company ID") @RequestParam(required = false) Long companyId,
            @Parameter(description = "Filter by organization / company name") @RequestParam(required = false) String organization,
            @Parameter(description = "Filter by location / city") @RequestParam(required = false) String location,
            @Parameter(description = "Viewer latitude for radius calculation") @RequestParam(required = false) Double latitude,
            @Parameter(description = "Viewer longitude for radius calculation") @RequestParam(required = false) Double longitude,
            @Parameter(description = "Geographic radius filter in km (1 - 100)") @RequestParam(required = false) Double radiusKm,
            @Parameter(description = "Minimum age") @RequestParam(required = false) Integer minAge,
            @Parameter(description = "Maximum age") @RequestParam(required = false) Integer maxAge,
            @Parameter(description = "Gender filter") @RequestParam(required = false) String gender,
            @Parameter(description = "Intent filter (DATING, NETWORKING, etc.)") @RequestParam(required = false) String intent) {
        Long currentUserId = com.campusconnect.security.SecurityUtils.resolveUserId(userId);
        if (currentUserId == null) {
            throw new BadRequestException("User ID must be provided via authentication or query parameter.");
        }
        List<DiscoverCardResponse> feed = discoveryCardService.getDiscoveryFeed(
                currentUserId,
                includePassed,
                mode,
                campusStatus,
                collegeId,
                college,
                fieldOfStudyId,
                fieldOfStudy,
                companyId,
                organization,
                location,
                latitude,
                longitude,
                radiusKm,
                minAge,
                maxAge,
                gender,
                intent
        );
        return ResponseEntity.ok(ApiResponse.ok(feed));
    }
}
