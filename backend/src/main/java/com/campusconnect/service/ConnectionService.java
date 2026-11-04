package com.campusconnect.service;

import com.campusconnect.dto.request.SendConnectRequest;
import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.response.ChatMessageResponse;
import com.campusconnect.dto.response.ConnectRequestResponse;
import com.campusconnect.dto.response.ConnectionResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final UserRepository userRepository;
    private final ConnectRequestRepository requestRepository;
    private final ConnectionRepository connectionRepository;
    private final ChatMessageRepository messageRepository;

    @Transactional
    public ConnectRequestResponse sendConnectRequest(SendConnectRequest requestDto) {
        if (requestDto.getSenderId().equals(requestDto.getReceiverId())) {
            throw new BadRequestException("Cannot send connect request to yourself.");
        }

        User sender = userRepository.findById(requestDto.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + requestDto.getSenderId()));
        User receiver = userRepository.findById(requestDto.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found with id: " + requestDto.getReceiverId()));

        if (connectionRepository.findBetweenUsers(sender, receiver).isPresent()) {
            throw new BadRequestException("You are already connected with this student.");
        }

        ConnectRequest request = ConnectRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .note(requestDto.getNote())
                .status(ConnectRequest.RequestStatus.PENDING)
                .build();

        ConnectRequest saved = requestRepository.save(request);
        return ConnectRequestResponse.fromEntity(saved);
    }

    @Transactional
    public ConnectionResponse acceptConnectRequest(Long requestId, Long currentUserId) {
        ConnectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Only the recipient can accept this connection request.");
        }

        request.setStatus(ConnectRequest.RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        requestRepository.save(request);

        Connection connection = Connection.builder()
                .user1(request.getSender())
                .user2(request.getReceiver())
                .originRequest(request)
                .build();

        Connection saved = connectionRepository.save(connection);
        return ConnectionResponse.fromEntity(saved, currentUserId);
    }

    @Transactional
    public ConnectRequestResponse declineConnectRequest(Long requestId, Long currentUserId) {
        ConnectRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Only the recipient can decline this connection request.");
        }

        request.setStatus(ConnectRequest.RequestStatus.DECLINED);
        request.setRespondedAt(LocalDateTime.now());
        ConnectRequest saved = requestRepository.save(request);
        return ConnectRequestResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ConnectRequestResponse> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return requestRepository.findByReceiverAndStatus(user, ConnectRequest.RequestStatus.PENDING)
                .stream()
                .map(ConnectRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConnectionResponse> getUserConnections(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return connectionRepository.findAllForUser(user)
                .stream()
                .map(c -> ConnectionResponse.fromEntity(c, userId))
                .toList();
    }

    /**
     * Core Rule: Messaging unlocked strictly after mutual connection is accepted.
     */
    @Transactional
    public ChatMessageResponse sendMessage(Long connectionId, SendMessageRequest requestDto) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        User sender = userRepository.findById(requestDto.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + requestDto.getSenderId()));

        boolean isParticipant = connection.getUser1().getId().equals(requestDto.getSenderId()) ||
                                connection.getUser2().getId().equals(requestDto.getSenderId());

        if (!isParticipant) {
            throw new BadRequestException("You are not part of this connection. Messaging is locked.");
        }

        ChatMessage message = ChatMessage.builder()
                .connection(connection)
                .sender(sender)
                .content(requestDto.getContent().trim())
                .build();

        connection.setLastInteractionAt(LocalDateTime.now());
        connectionRepository.save(connection);

        ChatMessage saved = messageRepository.save(message);
        return ChatMessageResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getConnectionMessages(Long connectionId, Long userId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found with id: " + connectionId));

        boolean isParticipant = connection.getUser1().getId().equals(userId) ||
                                connection.getUser2().getId().equals(userId);

        if (!isParticipant) {
            throw new BadRequestException("Unauthorized access to connection conversation.");
        }

        return messageRepository.findByConnectionOrderBySentAtAsc(connection)
                .stream()
                .map(ChatMessageResponse::fromEntity)
                .toList();
    }
}
