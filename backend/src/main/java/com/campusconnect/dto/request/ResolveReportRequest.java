package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Admin resolution request for student violation report")
public class ResolveReportRequest {

    @NotBlank(message = "Action is required (e.g. SUSPEND_USER, RESOLVE_NO_ACTION, DISMISSED, WARNING_ISSUED)")
    @Schema(description = "Resolution action taken by administrator", example = "SUSPEND_USER")
    private String action;

    @Schema(description = "Optional reviewer notes detailing rationale for decision")
    private String reviewerNotes;

    @Schema(description = "Whether to immediately suspend the reported user's account", example = "true")
    private Boolean suspendReportedUser;
}
