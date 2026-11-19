package com.campusconnect.repository;

import com.campusconnect.model.ConnectRequest;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectRequestRepository extends JpaRepository<ConnectRequest, Long> {
    List<ConnectRequest> findByReceiverAndStatus(User receiver, ConnectRequest.RequestStatus status);
    List<ConnectRequest> findBySender(User sender);
    List<ConnectRequest> findBySenderAndStatus(User sender, ConnectRequest.RequestStatus status);
    Optional<ConnectRequest> findBySenderAndReceiver(User sender, User receiver);

    @Query("SELECT r FROM ConnectRequest r WHERE (r.sender = :u1 AND r.receiver = :u2) OR (r.sender = :u2 AND r.receiver = :u1)")
    List<ConnectRequest> findAllBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);
}
