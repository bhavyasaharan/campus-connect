package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a Campus Meme.
 * Lives exclusively under the Memes section; strictly separate from User Posts.
 */
@Entity
@Table(name = "campus_memes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusMeme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 1000)
    private String imageUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String caption;

    @Builder.Default
    @Column(nullable = false, length = 100)
    private String category = "All Memes";

    @Builder.Default
    @Column(nullable = false)
    private int likesCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
