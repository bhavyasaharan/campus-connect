package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payload to report a student for violation of community standards")
public class ReportUserRequest {

    @Schema(description = "Reporting student ID (defaults to authenticated user via JWT)", example = "1")
    private Long reporterId;

    @NotNull(message = "reportedId is required")
    @Schema(description = "Reported student ID", example = "2")
    private Long reportedId;

    @NotBlank(message = "Reason is required")
    @Schema(description = "Reason category (HARASSMENT, SPAM, INAPPROPRIATE_CONTENT, IMPERSONATION, OTHER)", example = "HARASSMENT")
    private String reason;

    @Schema(description = "Detailed explanation or context of the report", example = "User was sending inappropriate messages")
    private String details;
}
