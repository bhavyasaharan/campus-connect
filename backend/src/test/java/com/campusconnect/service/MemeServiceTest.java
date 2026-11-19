package com.campusconnect.service;

import com.campusconnect.dto.request.CreateMemeRequest;
import com.campusconnect.dto.response.CampusMemeResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.CampusMeme;
import com.campusconnect.model.User;
import com.campusconnect.repository.CampusMemeRepository;
import com.campusconnect.repository.MemeLikeRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.impl.MemeServiceImpl;
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
class MemeServiceTest {

    @Mock
    private CampusMemeRepository campusMemeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MemeLikeRepository memeLikeRepository;

    @InjectMocks
    private MemeServiceImpl memeService;

    private User student;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L)
                .handle("alex_campus")
                .displayName("Alex Campus")
                .build();
    }

    @Test
    @DisplayName("Create meme under meme section succeeds with category tag")
    void testCreateMeme_Success() {
        CreateMemeRequest request = CreateMemeRequest.builder()
                .authorId(1L)
                .imageUrl("http://localhost:8080/api/upload/image/exam_meme.jpg")
                .caption("When viva examiner asks question 1 😭")
                .category("Exams & Viva")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(campusMemeRepository.save(any(CampusMeme.class))).thenAnswer(inv -> {
            CampusMeme meme = inv.getArgument(0);
            meme.setId(201L);
            return meme;
        });

        CampusMemeResponse res = memeService.createMeme(request, 1L);
        assertNotNull(res);
        assertEquals(201L, res.getId());
        assertEquals("Exams & Viva", res.getCategory());
        assertEquals("When viva examiner asks question 1 😭", res.getCaption());
    }

    @Test
    @DisplayName("Get all memes returns memes and supports category filtering")
    void testGetAllMemes_Filtering() {
        CampusMeme m1 = CampusMeme.builder()
                .id(201L)
                .author(student)
                .caption("Hostel mess food meme")
                .category("Hostel Life")
                .build();

        when(campusMemeRepository.findByCategoryOrderByCreatedAtDesc("Hostel Life")).thenReturn(List.of(m1));

        List<CampusMemeResponse> memes = memeService.getAllMemes("Hostel Life");
        assertEquals(1, memes.size());
        assertEquals("Hostel Life", memes.get(0).getCategory());
    }

    @Test
    @DisplayName("React to meme increments likes reaction count")
    void testReactMeme_Success() {
        CampusMeme meme = CampusMeme.builder()
                .id(201L)
                .likesCount(5)
                .build();

        when(campusMemeRepository.findById(201L)).thenReturn(Optional.of(meme));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(memeLikeRepository.existsByMemeIdAndUserId(201L, 1L)).thenReturn(false);
        when(memeLikeRepository.countByMemeId(201L)).thenReturn(6L);
        when(campusMemeRepository.save(any(CampusMeme.class))).thenAnswer(inv -> inv.getArgument(0));

        CampusMemeResponse res = memeService.reactMeme(201L, 1L);
        assertEquals(6, res.getLikesCount());
    }

    @Test
    @DisplayName("Delete meme is authorized only for author")
    void testDeleteMeme_Authorization() {
        CampusMeme meme = CampusMeme.builder()
                .id(201L)
                .author(student)
                .build();

        when(campusMemeRepository.findById(201L)).thenReturn(Optional.of(meme));

        // Other user cannot delete
        assertThrows(ForbiddenException.class, () -> memeService.deleteMeme(201L, 999L));

        // Author can delete
        memeService.deleteMeme(201L, 1L);
        verify(campusMemeRepository, times(1)).delete(meme);
    }
}
