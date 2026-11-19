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
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    List<User> findByVerificationStatus(VerificationStatus status);

    default Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) return Optional.empty();
        String clean = identifier.trim();
        if (clean.startsWith("@")) clean = clean.substring(1).trim();

        Optional<User> u = findByHandleIgnoreCase(clean);
        if (u.isPresent()) return u;

        u = findByInstagramUsernameIgnoreCase(clean);
        if (u.isPresent()) return u;

        u = findByEmailIgnoreCase(clean);
        if (u.isPresent()) return u;

        return findByPhone(clean);
    }
}
