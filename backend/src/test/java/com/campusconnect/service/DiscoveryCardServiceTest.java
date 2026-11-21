package com.campusconnect.service;

import com.campusconnect.dto.request.UpdateDiscoverCardRequest;
import com.campusconnect.dto.response.DiscoverCardResponse;
import com.campusconnect.dto.response.ExpandedDiscoveryProfileResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import com.campusconnect.service.impl.DiscoveryCardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscoveryCardServiceTest {

    @Mock
    private DiscoverCardRepository discoverCardRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPostRepository userPostRepository;

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private ConnectRequestRepository connectRequestRepository;

    @Mock
    private UserBlockRepository userBlockRepository;

    @Mock
    private ConnectionService connectionService;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @InjectMocks
    private DiscoveryCardServiceImpl discoveryCardService;

    private User student1;
    private User student2;
    private StudentProfile profile1;
    private StudentProfile profile2;

    @BeforeEach
    void setUp() {
        student1 = User.builder()
                .id(1L)
                .handle("sophia_chen")
                .displayName("Sophia Chen")
                .build();

        profile1 = StudentProfile.builder()
                .user(student1)
                .college("Stanford University")
                .course("Cognitive Science")
                .graduationYear("Senior 2025")
                .bio("Main bio for student profile #Design #Tech")
                .avatarUrl("https://example.com/sophia_avatar.jpg")
                .interests("Design, Tech")
                .build();
        student1.setProfile(profile1);

        student2 = User.builder()
                .id(2L)
                .handle("alex_campus")
                .displayName("Alex Campus")
                .build();

        profile2 = StudentProfile.builder()
                .user(student2)
                .college("Campus University")
                .course("Computer Engineering")
                .graduationYear("Junior 2026")
                .bio("Alex bio #Robotics")
                .avatarUrl("https://example.com/alex_avatar.jpg")
                .interests("Robotics")
                .build();
        student2.setProfile(profile2);
    }

    @Test
    @DisplayName("getMyCard returns card and available uploaded photos")
    void testGetMyCard_DefaultAndCustom() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student1));
        when(studentProfileRepository.findByUser(student1)).thenReturn(Optional.of(profile1));
        when(discoverCardRepository.findByUser(student1)).thenReturn(Optional.empty());
        when(userPostRepository.findByAuthorOrderByCreatedAtDesc(student1)).thenReturn(List.of(
                UserPost.builder().id(10L).author(student1).imageUrl("https://example.com/post_photo.jpg").build()
        ));

        DiscoverCardResponse response = discoveryCardService.getMyCard(1L);
        assertNotNull(response);
        assertEquals("Sophia Chen", response.getUser().getDisplayName());
        assertEquals("https://example.com/sophia_avatar.jpg", response.getMainPhotoUrl());
        assertTrue(response.getAvailablePhotos().contains("https://example.com/sophia_avatar.jpg"));
        assertTrue(response.getAvailablePhotos().contains("https://example.com/post_photo.jpg"));
    }

    @Test
    @DisplayName("updateMyCard saves custom discovery bio and does not overwrite main bio")
    void testUpdateMyCard_Success() {
        UpdateDiscoverCardRequest request = UpdateDiscoverCardRequest.builder()
                .discoveryBio("Custom short discovery bio! 🚀")
                .mainPhotoUrl("https://example.com/sophia_avatar.jpg")
                .showCollege(true)
                .showCourse(false)
                .showInterests(true)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student1));
        when(studentProfileRepository.findByUser(student1)).thenReturn(Optional.of(profile1));
        when(discoverCardRepository.findByUser(student1)).thenReturn(Optional.empty());
        when(discoverCardRepository.save(any(DiscoverCard.class))).thenAnswer(inv -> inv.getArgument(0));

        DiscoverCardResponse response = discoveryCardService.updateMyCard(1L, request);
        assertNotNull(response);
        assertEquals("Custom short discovery bio! 🚀", response.getDiscoveryBio());
        assertFalse(response.isShowCourse());
        assertTrue(response.isShowCollege());

        // Verify main student bio is untouched
        assertEquals("Main bio for student profile #Design #Tech", profile1.getBio());
    }

    @Test
    void testJacksonPassout() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        DiscoverCardResponse resp = DiscoverCardResponse.builder().isPassout(true).passoutYear(2025).build();
        String json = mapper.writeValueAsString(resp);
        assertTrue(json.contains("\"isPassout\":true"));

        String inputJson = "{\"isPassout\":true,\"passoutYear\":2025}";
        UpdateDiscoverCardRequest req = mapper.readValue(inputJson, UpdateDiscoverCardRequest.class);
        assertTrue(req.getIsPassout());
    }


    @Test
    @DisplayName("updateMyCard rejects selected photo that does not belong to user")
    void testUpdateMyCard_RejectsForeignPhoto() {
        UpdateDiscoverCardRequest request = UpdateDiscoverCardRequest.builder()
                .discoveryBio("Hello")
                .mainPhotoUrl("https://unrelated-domain.com/stolen_photo.jpg")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student1));
        when(studentProfileRepository.findByUser(student1)).thenReturn(Optional.of(profile1));
        when(userPostRepository.findByAuthorOrderByCreatedAtDesc(student1)).thenReturn(List.of());

        assertThrows(BadRequestException.class, () -> discoveryCardService.updateMyCard(1L, request));
    }

    @Test
    @DisplayName("getExpandedProfile returns swipeable photo gallery and connection status")
    void testGetExpandedProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student2));
        when(studentProfileRepository.findByUser(student2)).thenReturn(Optional.of(profile2));
        when(userBlockRepository.isBlockedBetween(student1, student2)).thenReturn(false);
        when(discoverCardRepository.findByUser(student2)).thenReturn(Optional.empty());
        when(connectionRepository.findBetweenUsers(student1, student2)).thenReturn(Optional.empty());
        when(connectRequestRepository.findBySenderAndReceiver(student1, student2)).thenReturn(Optional.empty());

        ExpandedDiscoveryProfileResponse response = discoveryCardService.getExpandedProfile(1L, 2L);
        assertNotNull(response);
        assertEquals("Alex Campus", response.getUser().getDisplayName());
        assertFalse(response.isConnected());
        assertFalse(response.isHasPendingRequest());
        assertTrue(response.getPhotoGallery().contains("https://example.com/alex_avatar.jpg"));
    }
}
