package com.campusconnect.repository;

import com.campusconnect.model.ChatMessage;
import com.campusconnect.model.Connection;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConnectionOrderBySentAtAsc(Connection connection);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.readAt = :readAt WHERE m.connection = :connection AND m.sender <> :user AND m.readAt IS NULL")
    int markAsRead(@Param("connection") Connection connection, @Param("user") User user, @Param("readAt") LocalDateTime readAt);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.connection = :connection AND m.sender <> :user AND m.readAt IS NULL")
    long countUnreadForUser(@Param("connection") Connection connection, @Param("user") User user);

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.connection = :connection")
    void deleteByConnection(@Param("connection") Connection connection);
}
