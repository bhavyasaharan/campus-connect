package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies", indexes = {
    @Index(name = "idx_companies_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(length = 100)
    private String industry;

    @Column(length = 100)
    private String domain;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

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
