package com.campusconnect.repository;

import com.campusconnect.model.User;
import com.campusconnect.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByHandleIgnoreCase(String handle);
    Optional<User> findByInstagramUsernameIgnoreCase(String instagramUsername);
    Optional<User> findByInstagramScopedUserId(String instagramScopedUserId);
    boolean existsByInstagramScopedUserId(String instagramScopedUserId);
    boolean existsByInstagramUsernameIgnoreCase(String instagramUsername);
    List<User> findByVerificationStatus(VerificationStatus status);
}
