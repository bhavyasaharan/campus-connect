package com.campusconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Standard error response envelope")
public class ErrorResponse {

    @Builder.Default
    @Schema(description = "Indicates failure", example = "false")
    private boolean success = false;

    @Schema(description = "HTTP error status code", example = "400")
    private int status;

    @Schema(description = "HTTP error title", example = "Bad Request")
    private String error;

    @Schema(description = "Detailed error message", example = "Validation failed for request parameters")
    private String message;

    @Schema(description = "Request path where error occurred", example = "/api/users/register")
    private String path;

    @Schema(description = "Field-level validation error map")
    private Map<String, String> validationErrors;

    @Builder.Default
    @Schema(description = "Error timestamp")
    private LocalDateTime timestamp = LocalDateTime.now();
}
