package com.campusconnect.repository;

import com.campusconnect.model.DiscoverCard;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscoverCardRepository extends JpaRepository<DiscoverCard, Long> {
    Optional<DiscoverCard> findByUser(User user);
    Optional<DiscoverCard> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
