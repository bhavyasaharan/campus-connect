package com.campusconnect.repository;

import com.campusconnect.model.AuthSessionLog;
import com.campusconnect.model.UserType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuthSessionLogRepository extends JpaRepository<AuthSessionLog, Long> {

    List<AuthSessionLog> findAllByOrderByCreatedAtDesc();

    List<AuthSessionLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuthSessionLog> findByUserTypeAndUserIdOrderByCreatedAtDesc(UserType userType, Long userId);
}
