package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feed_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedPost {

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
    private int likesCount = 0;

    @Builder.Default
    private int commentsCount = 0;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
