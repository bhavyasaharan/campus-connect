package com.campusconnect.dto.response;

import com.campusconnect.model.ReportStatus;
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
@Schema(description = "User report confirmation response")
public class ReportResponse {

    @Schema(description = "Report ID", example = "1")
    private Long id;

    @Schema(description = "ID of the student who was reported", example = "2")
    private Long reportedUserId;

    @Schema(description = "Category reason", example = "HARASSMENT")
    private String reason;

    @Schema(description = "Status of the report", example = "PENDING")
    private ReportStatus status;

    @Schema(description = "Timestamp when report was filed")
    private LocalDateTime reportedAt;
}
