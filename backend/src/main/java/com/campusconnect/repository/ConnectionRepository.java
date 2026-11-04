package com.campusconnect.repository;

import com.campusconnect.model.Connection;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    @Query("SELECT c FROM Connection c WHERE c.user1 = :user OR c.user2 = :user ORDER BY c.lastInteractionAt DESC")
    List<Connection> findAllForUser(@Param("user") User user);

    @Query("SELECT c FROM Connection c WHERE (c.user1 = :u1 AND c.user2 = :u2) OR (c.user1 = :u2 AND c.user2 = :u1)")
    Optional<Connection> findBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);
}
