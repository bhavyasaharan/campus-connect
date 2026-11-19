package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "colleges", indexes = {
    @Index(name = "idx_colleges_name", columnList = "name"),
    @Index(name = "idx_colleges_short_name", columnList = "shortName"),
    @Index(name = "idx_colleges_city", columnList = "city")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(name = "short_name", length = 50)
    private String shortName;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    @Builder.Default
    private String country = "India";

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = true;

    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private int usageCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
