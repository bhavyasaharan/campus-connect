package com.campusconnect.repository;

import com.campusconnect.model.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {

    Optional<AdminUser> findByUsernameIgnoreCase(String username);

    Optional<AdminUser> findByEmailIgnoreCase(String email);

    @Query("SELECT a FROM AdminUser a WHERE LOWER(a.username) = LOWER(:identifier) OR LOWER(a.email) = LOWER(:identifier)")
    Optional<AdminUser> findByIdentifier(@Param("identifier") String identifier);
}
