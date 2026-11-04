package com.campusconnect.repository;

import com.campusconnect.model.ProcessedWebhookMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessedWebhookMessageRepository extends JpaRepository<ProcessedWebhookMessage, Long> {
    Optional<ProcessedWebhookMessage> findByMessageId(String messageId);
    boolean existsByMessageId(String messageId);
}
