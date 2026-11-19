package com.campusconnect.service;

import com.campusconnect.dto.request.CreateUserPostRequest;
import com.campusconnect.dto.response.UserPostResponse;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.model.Connection;
import com.campusconnect.model.User;
import com.campusconnect.model.UserPost;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.PostLikeRepository;
import com.campusconnect.repository.UserPostRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.impl.UserPostServiceImpl;
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
class UserPostServiceTest {

    @Mock
    private UserPostRepository userPostRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @InjectMocks
    private UserPostServiceImpl userPostService;

    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L)
                .handle("alex_campus")
                .displayName("Alex Campus")
                .build();

        otherStudent = User.builder()
                .id(2L)
                .handle("sophia_chen")
                .displayName("Sophia Chen")
                .build();
    }

    @Test
    @DisplayName("Create user post succeeds and is attached to student profile")
    void testCreatePost_Success() {
        CreateUserPostRequest request = CreateUserPostRequest.builder()
                .authorId(1L)
                .imageUrl("http://localhost:8080/api/upload/image/project.jpg")
                .caption("Campus robotics presentation! 🤖")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userPostRepository.save(any(UserPost.class))).thenAnswer(inv -> {
            UserPost post = inv.getArgument(0);
            post.setId(101L);
            return post;
        });

        UserPostResponse res = userPostService.createPost(request, 1L);
        assertNotNull(res);
        assertEquals(101L, res.getId());
        assertEquals("Campus robotics presentation! 🤖", res.getCaption());
        assertEquals("alex_campus", res.getAuthor().getHandle());
    }

    @Test
    @DisplayName("Get user posts returns posts ordered by creation date")
    void testGetUserPosts_Success() {
        UserPost p1 = UserPost.builder()
                .id(101L)
                .author(student)
                .imageUrl("http://localhost:8080/p1.jpg")
                .caption("First post")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userPostRepository.findByAuthorOrderByCreatedAtDesc(student)).thenReturn(List.of(p1));

        List<UserPostResponse> posts = userPostService.getUserPosts(1L);
        assertEquals(1, posts.size());
        assertEquals("First post", posts.get(0).getCaption());
    }

    @Test
    @DisplayName("Author can delete their own post but others are forbidden")
    void testDeletePost_Authorization() {
        UserPost post = UserPost.builder()
                .id(101L)
                .author(student)
                .build();

        when(userPostRepository.findById(101L)).thenReturn(Optional.of(post));

        // Unauthorized user attempt
        assertThrows(ForbiddenException.class, () -> userPostService.deletePost(101L, 2L));

        // Authorized author attempt
        userPostService.deletePost(101L, 1L);
        verify(userPostRepository, times(1)).delete(post);
    }

    @Test
    @DisplayName("Viewer cannot see student posts if they are not connected")
    void testGetUserPosts_HiddenWhenNotConnected() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherStudent));
        when(connectionRepository.findBetweenUsers(otherStudent, student)).thenReturn(Optional.empty());

        List<UserPostResponse> posts = userPostService.getUserPosts(1L, 2L);
        assertNotNull(posts);
        assertTrue(posts.isEmpty(), "Non-connected viewer must receive empty posts list");
    }

    @Test
    @DisplayName("Viewer can see student posts if they are connected")
    void testGetUserPosts_VisibleWhenConnected() {
        UserPost p1 = UserPost.builder()
                .id(101L)
                .author(student)
                .imageUrl("http://localhost:8080/p1.jpg")
                .caption("Campus post")
                .build();

        Connection conn = Connection.builder()
                .id(1L)
                .user1(otherStudent)
                .user2(student)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherStudent));
        when(connectionRepository.findBetweenUsers(otherStudent, student)).thenReturn(Optional.of(conn));
        when(userPostRepository.findByAuthorOrderByCreatedAtDesc(student)).thenReturn(List.of(p1));

        List<UserPostResponse> posts = userPostService.getUserPosts(1L, 2L);
        assertEquals(1, posts.size());
        assertEquals("Campus post", posts.get(0).getCaption());
    }

    @Test
    @DisplayName("Author viewing own profile can see their posts without connection check")
    void testGetUserPosts_AuthorViewsOwnProfile() {
        UserPost p1 = UserPost.builder()
                .id(101L)
                .author(student)
                .imageUrl("http://localhost:8080/p1.jpg")
                .caption("My own post")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userPostRepository.findByAuthorOrderByCreatedAtDesc(student)).thenReturn(List.of(p1));

        List<UserPostResponse> posts = userPostService.getUserPosts(1L, 1L);
        assertEquals(1, posts.size());
        assertEquals("My own post", posts.get(0).getCaption());
        verify(connectionRepository, never()).findBetweenUsers(any(), any());
    }
}
