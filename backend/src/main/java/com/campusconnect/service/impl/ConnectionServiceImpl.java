package com.campusconnect.service.impl;

import com.campusconnect.dto.request.PassUserRequest;
import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import com.campusconnect.service.ConnectionService;
import com.campusconnect.websocket.ChatMessagePublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConnectionServiceImpl implements ConnectionService {

    private final UserRepository userRepository;
    private final ConnectRequestRepository requestRepository;
    private final ConnectionRepository connectionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserPassRepository passRepository;
    private final UserBlockRepository blockRepository;
    private final ChatMessagePublisher chatMessagePublisher;

    @Override
    @Transactional
    public ConnectRequestResponse sendConnectRequest(SendConnectRequest requestDto) {
        if (requestDto.getSenderId().equals(requestDto.getReceiverId())) {
            throw new BadRequestException("Cannot send connect request to yourself.");
        }

        User sender = userRepository.findById(requestDto.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + requestDto.getSenderId()));
        User receiver = userRepository.findById(requestDto.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found with id: " + requestDto.getReceiverId()));

        if (sender.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. You cannot send connection requests.");
        }

        if (receiver.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BadRequestException("This user's account is suspended and cannot receive connection requests.");
        }

        if (blockRepository.isBlockedBetween(sender, receiver)) {
            throw new ForbiddenException("Unable to send request. Communications are blocked between these profiles.");
        }

        if (connectionRepository.findBetweenUsers(sender, receiver).isPresent()) {
            throw new BadRequestException("You are already connected with this student.");
        }

        Optional<ConnectRequest> pendingExisting = requestRepository.findBySenderAndReceiver(sender, receiver);
        if (pendingExisting.isPresent() && pendingExisting.get().getStatus() == ConnectRequest.RequestStatus.PENDING) {
            throw new BadRequestException("A connection request to this student is already pending.");
        }

        Optional<ConnectRequest> incomingPending = requestRepository.findBySenderAndReceiver(receiver, sender);
        if (incomingPending.isPresent() && incomingPending.get().getStatus() == ConnectRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This student has already sent you a connection request. Please accept their request instead.");
        }

        // If the sender previously passed this user in discovery, remove the pass
        passRepository.findByUserAndPassedUser(sender, receiver).ifPresent(passRepository::delete);

        ConnectRequest request = ConnectRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .note(requestDto.getNote() != null ? requestDto.getNote().trim() : null)
                .status(ConnectRequest.RequestStatus.PENDING)
                .build();

        ConnectRequest saved = requestRepository.save(request);
        return ConnectRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ConnectionResponse acceptConnectRequest(Long requestId, Long currentUserId) {
        ConnectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to accept this connection request.");
        }

        if (request.getStatus() != ConnectRequest.RequestStatus.PENDING) {
            throw new BadRequestException("Cannot accept a request that is already " + request.getStatus());
        }

        if (request.getReceiver().getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. You cannot accept connection requests.");
        }

        if (blockRepository.isBlockedBetween(request.getSender(), request.getReceiver())) {
            throw new ForbiddenException("Cannot accept request. A block is active between these users.");
        }

        request.setStatus(ConnectRequest.RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        requestRepository.save(request);

        // Canonical ordering: user1_id < user2_id to guarantee unique pairs
        User userA = request.getSender();
        User userB = request.getReceiver();
        User first = userA.getId() < userB.getId() ? userA : userB;
        User second = userA.getId() < userB.getId() ? userB : userA;

        Connection connection = Connection.builder()
                .user1(first)
                .user2(second)
                .originRequest(request)
                .build();

        Connection saved = connectionRepository.save(connection);

        // Core Rule: When accepted, private chat conversation is unlocked.
        // If the sender included an introductory note, seed it as the starter message!
        if (request.getNote() != null && !request.getNote().isBlank()) {
            ChatMessage starterMessage = ChatMessage.builder()
                    .connection(saved)
                    .sender(request.getSender())
                    .content(request.getNote())
                    .sentAt(LocalDateTime.now())
                    .build();
            ChatMessage savedStarter = messageRepository.save(starterMessage);
            if (chatMessagePublisher != null) {
                chatMessagePublisher.publishDirectMessage(saved, ChatMessageResponse.fromEntity(savedStarter));
            }
        }

        ConnectionResponse response = ConnectionResponse.fromEntity(saved, currentUserId, 0L);
        if (chatMessagePublisher != null) {
            ConnectionResponse resForUser1 = ConnectionResponse.fromEntity(saved, saved.getUser1().getId(), 0L);
            ConnectionResponse resForUser2 = ConnectionResponse.fromEntity(saved, saved.getUser2().getId(), 0L);
            chatMessagePublisher.publishConnectionAccepted(saved, resForUser1, resForUser2);
        }

        return response;
    }

    @Override
    @Transactional
    public ConnectRequestResponse declineConnectRequest(Long requestId, Long currentUserId) {
        ConnectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to decline this connection request.");
        }

        if (request.getStatus() != ConnectRequest.RequestStatus.PENDING) {
            throw new BadRequestException("Cannot decline a request that is already " + request.getStatus());
        }

        request.setStatus(ConnectRequest.RequestStatus.DECLINED);
        request.setRespondedAt(LocalDateTime.now());
        ConnectRequest saved = requestRepository.save(request);
        return ConnectRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void cancelConnectRequest(Long requestId, Long currentUserId) {
        ConnectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (!request.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to cancel this connection request.");
        }

        if (request.getStatus() != ConnectRequest.RequestStatus.PENDING) {
            throw new BadRequestException("Cannot cancel a request that is already " + request.getStatus());
        }

        requestRepository.delete(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConnectRequestResponse> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return requestRepository.findByReceiverAndStatus(user, ConnectRequest.RequestStatus.PENDING)
                .stream()
                .map(ConnectRequestResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConnectRequestResponse> getSentRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return requestRepository.findBySenderAndStatus(user, ConnectRequest.RequestStatus.PENDING)
                .stream()
                .map(ConnectRequestResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConnectionResponse> getUserConnections(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return connectionRepository.findAllForUser(user)
                .stream()
                .filter(c -> !blockRepository.isBlockedBetween(c.getUser1(), c.getUser2()))
                .map(c -> {
                    long unread = messageRepository.countUnreadForUser(c, user);
                    return ConnectionResponse.fromEntity(c, userId, unread);
                })
                .toList();
    }

    @Override
    @Transactional
    public void removeConnection(Long connectionId, Long currentUserId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        if (!connection.getUser1().getId().equals(currentUserId) && !connection.getUser2().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to remove this connection.");
        }

        // Clean up messages associated with the connection
        messageRepository.deleteByConnection(connection);

        // Remove origin connect request if present
        ConnectRequest originRequest = connection.getOriginRequest();
        if (originRequest != null) {
            connection.setOriginRequest(null);
            connectionRepository.saveAndFlush(connection);
            requestRepository.delete(originRequest);
        }

        connectionRepository.delete(connection);
    }

    @Override
    @Transactional
    public void removeConnectionWithUser(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException("Cannot remove connection with yourself.");
        }

        User user1 = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));
        User user2 = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        Connection connection = connectionRepository.findBetweenUsers(user1, user2)
                .orElseThrow(() -> new ResourceNotFoundException("No active connection found between these users."));

        removeConnection(connection.getId(), currentUserId);
    }

    @Override
    @Transactional
    public void passUser(PassUserRequest requestDto) {
        if (requestDto.getUserId().equals(requestDto.getPassedUserId())) {
            throw new BadRequestException("Cannot pass on yourself.");
        }

        User user = userRepository.findById(requestDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requestDto.getUserId()));
        User passedUser = userRepository.findById(requestDto.getPassedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Passed user not found with id: " + requestDto.getPassedUserId()));

        if (passRepository.findByUserAndPassedUser(user, passedUser).isEmpty()) {
            UserPass pass = UserPass.builder()
                    .user(user)
                    .passedUser(passedUser)
                    .build();
            passRepository.save(pass);
        }
    }

    @Override
    @Transactional
    public void resetPasses(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        passRepository.deleteByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getDiscoveryCandidates(Long userId, boolean includePassed) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Set<Long> excludedUserIds = new HashSet<>();
        excludedUserIds.add(userId);

        // Exclude existing connected users
        List<Connection> connections = connectionRepository.findAllForUser(user);
        for (Connection c : connections) {
            excludedUserIds.add(c.getUser1().getId());
            excludedUserIds.add(c.getUser2().getId());
        }

        // Exclude pending sent & received requests
        List<ConnectRequest> sentPending = requestRepository.findBySenderAndStatus(user, ConnectRequest.RequestStatus.PENDING);
        for (ConnectRequest r : sentPending) {
            excludedUserIds.add(r.getReceiver().getId());
        }
        List<ConnectRequest> receivedPending = requestRepository.findByReceiverAndStatus(user, ConnectRequest.RequestStatus.PENDING);
        for (ConnectRequest r : receivedPending) {
            excludedUserIds.add(r.getSender().getId());
        }

        // Exclude blocked users (both ways)
        List<Long> blockedByMe = blockRepository.findBlockedUserIdsByBlocker(user);
        excludedUserIds.addAll(blockedByMe);
        List<Long> blockedMe = blockRepository.findBlockerUserIdsWhoBlocked(user);
        excludedUserIds.addAll(blockedMe);

        // Exclude passed users unless explicitly requested
        if (!includePassed) {
            List<UserPass> passes = passRepository.findByUser(user);
            for (UserPass p : passes) {
                excludedUserIds.add(p.getPassedUser().getId());
            }
        }

        return userRepository.findAll().stream()
                .filter(u -> !excludedUserIds.contains(u.getId()))
                .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE)
                .map(UserResponse::fromEntity)
                .toList();
    }
}
