package com.campusconnect.repository;

import com.campusconnect.model.ChatMessage;
import com.campusconnect.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConnectionOrderBySentAtAsc(Connection connection);
}
