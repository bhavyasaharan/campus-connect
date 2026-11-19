package com.campusconnect.repository;

import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.User;
import com.campusconnect.model.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findByReporter(User reporter);
    List<UserReport> findByReported(User reported);
    List<UserReport> findAllByOrderByCreatedAtDesc();
    List<UserReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);
    long countByStatus(ReportStatus status);
}
