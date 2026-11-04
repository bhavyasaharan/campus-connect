package com.campusconnect.dto.response;

import com.campusconnect.model.FollowerSyncLog;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Follower synchronization reconciliation audit result")
public class FollowerSyncResponse {

    @Schema(description = "Sync log audit ID", example = "1")
    private Long id;

    @Schema(description = "Total Instagram handles extracted from JSON file", example = "1250")
    private int totalImported;

    @Schema(description = "Number of campus users confirmed as followers (VERIFIED)", example = "420")
    private int verifiedCount;

    @Schema(description = "Number of campus users not found in followers (RESTRICTED)", example = "15")
    private int restrictedCount;

    @Schema(description = "Uploaded file name", example = "followers_1.json")
    private String filename;

    @Schema(description = "Timestamp when reconciliation was executed")
    private LocalDateTime syncedAt;

    public static FollowerSyncResponse fromEntity(FollowerSyncLog log) {
        if (log == null) return null;
        return FollowerSyncResponse.builder()
                .id(log.getId())
                .totalImported(log.getTotalImported())
                .verifiedCount(log.getVerifiedCount())
                .restrictedCount(log.getRestrictedCount())
                .filename(log.getFilename())
                .syncedAt(log.getSyncedAt())
                .build();
    }
}
