package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "follower_sync_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowerSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int totalImported;
    private int verifiedCount;
    private int restrictedCount;
    private String filename;

    @Column(nullable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    protected void onCreate() {
        this.syncedAt = LocalDateTime.now();
    }
}
