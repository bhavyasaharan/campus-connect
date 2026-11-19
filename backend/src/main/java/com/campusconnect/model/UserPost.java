package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a student's personal profile post.
 * Supports multiple images and videos combined in a single post.
 * Strictly separate from Campus Memes.
 */
@Entity
@Table(name = "user_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 1000)
    private String imageUrl;

    @Column(name = "media_urls", columnDefinition = "TEXT")
    private String mediaUrls;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String caption;

    @Builder.Default
    @Column(nullable = false)
    private int likesCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
