package com.campusconnect.dto.response;

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
@Schema(description = "Standard API response envelope")
public class ApiResponse<T> {

    @Builder.Default
    @Schema(description = "Whether the request succeeded", example = "true")
    private boolean success = true;

    @Schema(description = "Optional informative response message", example = "Operation completed successfully")
    private String message;

    @Schema(description = "Response payload data")
    private T data;

    @Builder.Default
    @Schema(description = "Timestamp of the response")
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
