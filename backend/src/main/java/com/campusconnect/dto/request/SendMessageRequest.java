package com.campusconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to send a chat message within an active connection")
public class SendMessageRequest {

    @NotNull(message = "Sender ID is required")
    @Schema(description = "ID of the sending user", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long senderId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    @Schema(description = "Text message content", example = "Hey! Let's meet at the north library at 4 PM.", requiredMode = Schema.RequiredMode.REQUIRED)
    private String content;
}
