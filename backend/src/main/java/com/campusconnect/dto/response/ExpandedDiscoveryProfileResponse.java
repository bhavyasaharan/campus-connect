package com.campusconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Expanded Discovery Profile response with swipeable photo gallery and full academic details")
public class ExpandedDiscoveryProfileResponse {

    @Schema(description = "Base student profile information")
    private UserResponse user;

    @Schema(description = "Discovery bio")
    private String discoveryBio;

    @Schema(description = "Main discovery card photo URL")
    private String mainPhotoUrl;

    @Schema(description = "Swipeable photo gallery containing user's other uploaded photographs")
    private List<String> photoGallery;

    @Schema(description = "College or university / department name")
    private String college;

    @Schema(description = "Course and academic class information")
    private String course;

    @Schema(description = "Interests and hobbies")
    private List<String> interests;

    @Schema(description = "Whether college is visible on discovery card")
    private boolean showCollege;

    @Schema(description = "Whether course is visible on discovery card")
    private boolean showCourse;

    @Schema(description = "Whether interests are visible on discovery card")
    private boolean showInterests;

    @Schema(description = "Whether viewing student is mutually connected with this candidate")
    private boolean isConnected;

    @Schema(description = "Whether a pending connection request exists between the two students")
    private boolean hasPendingRequest;

    @Schema(description = "Existing connection ID if connected")
    private Long existingConnectionId;

    @Schema(description = "Existing connect request ID if pending")
    private Long existingRequestId;
}
