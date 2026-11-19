package com.campusconnect.dto.response;

import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.User;
import com.campusconnect.model.UserReport;
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
@Schema(description = "User report detail response for administrator moderation")
public class AdminReportResponse {

    @Schema(description = "Report ID", example = "1")
    private Long id;

    @Schema(description = "Reporting user ID", example = "10")
    private Long reporterId;

    @Schema(description = "Reporting student's handle", example = "john_doe")
    private String reporterHandle;

    @Schema(description = "Reporting student's display name", example = "John Doe")
    private String reporterDisplayName;

    @Schema(description = "Reporting student's avatar image URL")
    private String reporterAvatarUrl;

    @Schema(description = "Reported student user ID", example = "12")
    private Long reportedUserId;

    @Schema(description = "Reported student's handle", example = "bad_actor")
    private String reportedUserHandle;

    @Schema(description = "Reported student's display name", example = "Bad Actor")
    private String reportedUserDisplayName;

    @Schema(description = "Reported student's avatar image URL")
    private String reportedUserAvatarUrl;

    @Schema(description = "Current account status of reported student", example = "ACTIVE")
    private AccountStatus reportedUserAccountStatus;

    @Schema(description = "Report violation category/reason", example = "HARASSMENT")
    private String reason;

    @Schema(description = "Detailed report context written by reporter")
    private String details;

    @Schema(description = "Moderation status of this report", example = "PENDING")
    private ReportStatus status;

    @Schema(description = "Action taken by moderator", example = "USER_SUSPENDED")
    private String actionTaken;

    @Schema(description = "Internal administrator / reviewer notes")
    private String reviewerNotes;

    @Schema(description = "Timestamp when report was filed")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when report was resolved or dismissed")
    private LocalDateTime resolvedAt;

    public static AdminReportResponse fromEntity(UserReport report) {
        if (report == null) {
            return null;
        }
        User reporter = report.getReporter();
        User reported = report.getReported();

        return AdminReportResponse.builder()
                .id(report.getId())
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterHandle(reporter != null ? reporter.getHandle() : "unknown")
                .reporterDisplayName(reporter != null ? reporter.getDisplayName() : "Unknown Student")
                .reporterAvatarUrl(reporter != null && reporter.getProfile() != null ? reporter.getProfile().getAvatarUrl() : null)
                .reportedUserId(reported != null ? reported.getId() : null)
                .reportedUserHandle(reported != null ? reported.getHandle() : "unknown")
                .reportedUserDisplayName(reported != null ? reported.getDisplayName() : "Unknown Student")
                .reportedUserAvatarUrl(reported != null && reported.getProfile() != null ? reported.getProfile().getAvatarUrl() : null)
                .reportedUserAccountStatus(reported != null ? reported.getAccountStatus() : null)
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus())
                .actionTaken(report.getActionTaken())
                .reviewerNotes(report.getReviewerNotes())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}
