package com.campusconnect.repository;

import com.campusconnect.model.ConnectRequest;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectRequestRepository extends JpaRepository<ConnectRequest, Long> {
    List<ConnectRequest> findByReceiverAndStatus(User receiver, ConnectRequest.RequestStatus status);
    List<ConnectRequest> findBySender(User sender);
    Optional<ConnectRequest> findBySenderAndReceiver(User sender, User receiver);
}
