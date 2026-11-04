package com.campusconnect.repository;

import com.campusconnect.model.FollowerSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowerSyncLogRepository extends JpaRepository<FollowerSyncLog, Long> {
    List<FollowerSyncLog> findAllByOrderBySyncedAtDesc();
}
