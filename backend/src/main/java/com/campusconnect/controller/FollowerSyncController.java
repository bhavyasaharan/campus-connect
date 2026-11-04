package com.campusconnect.controller;

import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.FollowerSyncResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.service.FollowerVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin & Follower Reconciliation", description = "Bulk follower JSON export parsing, handle reconciliation, and audit logs")
public class FollowerSyncController {

    private final FollowerVerificationService verificationService;

    @PostMapping(value = "/sync-followers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and reconcile Instagram followers export", description = "Uploads an Instagram follower export JSON file (e.g. followers_1.json), extracts all follower usernames, and reconciles campus user verification statuses.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Follower export reconciled successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "File is empty or invalid JSON structure")
    })
    public ResponseEntity<ApiResponse<FollowerSyncResponse>> uploadFollowersJson(
            @Parameter(description = "Instagram followers export JSON file", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(type = "string", format = "binary")))
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded followers file cannot be empty");
        }

        try {
            Set<String> followerHandles = verificationService.parseFollowersJson(file.getInputStream());
            FollowerSyncResponse log = verificationService.reconcileUsers(followerHandles, file.getOriginalFilename());
            return ResponseEntity.ok(ApiResponse.ok("Followers reconciled successfully", log));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Follower reconciliation failed: " + e.getMessage());
        }
    }

    @GetMapping("/sync-logs")
    @Operation(summary = "Get follower reconciliation logs", description = "Retrieves historical audit records of previous follower synchronization batches.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Sync audit logs retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<FollowerSyncResponse>>> getSyncLogs() {
        List<FollowerSyncResponse> logs = verificationService.getSyncLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
