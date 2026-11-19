package com.campusconnect.service.impl;

import com.campusconnect.dto.request.BlockUserRequest;
import com.campusconnect.dto.request.ReportUserRequest;
import com.campusconnect.dto.request.UnblockUserRequest;
import com.campusconnect.dto.response.BlockedUserResponse;
import com.campusconnect.dto.response.ReportResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.AccountStatus;
import com.campusconnect.model.ConnectRequest;
import com.campusconnect.model.ReportStatus;
import com.campusconnect.model.User;
import com.campusconnect.model.UserBlock;
import com.campusconnect.model.UserReport;
import com.campusconnect.repository.ConnectRequestRepository;
import com.campusconnect.repository.ConnectionRepository;
import com.campusconnect.repository.UserBlockRepository;
import com.campusconnect.repository.UserReportRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.UserSafetyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserSafetyServiceImpl implements UserSafetyService {

    private final UserRepository userRepository;
    private final UserBlockRepository blockRepository;
    private final UserReportRepository reportRepository;
    private final ConnectionRepository connectionRepository;
    private final ConnectRequestRepository requestRepository;

    @Override
    @Transactional
    public void blockUser(BlockUserRequest requestDto) {
        if (requestDto.getBlockerId().equals(requestDto.getBlockedId())) {
            throw new BadRequestException("You cannot block yourself.");
        }

        User blocker = userRepository.findById(requestDto.getBlockerId())
                .orElseThrow(() -> new ResourceNotFoundException("Blocker not found with id: " + requestDto.getBlockerId()));
        User blocked = userRepository.findById(requestDto.getBlockedId())
                .orElseThrow(() -> new ResourceNotFoundException("Blocked user not found with id: " + requestDto.getBlockedId()));

        if (blocker.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. You cannot block users.");
        }

        if (blockRepository.findByBlockerAndBlocked(blocker, blocked).isEmpty()) {
            UserBlock block = UserBlock.builder()
                    .blocker(blocker)
                    .blocked(blocked)
                    .reason(requestDto.getReason())
                    .build();
            blockRepository.save(block);
        }

        // Dissolve any active mutual connection
        connectionRepository.findBetweenUsers(blocker, blocked).ifPresent(connectionRepository::delete);

        // Cancel/decline pending requests between them
        List<ConnectRequest> requests = requestRepository.findAllBetweenUsers(blocker, blocked);
        for (ConnectRequest r : requests) {
            if (r.getStatus() == ConnectRequest.RequestStatus.PENDING) {
                r.setStatus(ConnectRequest.RequestStatus.DECLINED);
                r.setRespondedAt(LocalDateTime.now());
                requestRepository.save(r);
            }
        }
    }

    @Override
    @Transactional
    public void unblockUser(UnblockUserRequest requestDto) {
        User blocker = userRepository.findById(requestDto.getBlockerId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requestDto.getBlockerId()));
        User blocked = userRepository.findById(requestDto.getBlockedId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requestDto.getBlockedId()));

        blockRepository.findByBlockerAndBlocked(blocker, blocked).ifPresent(blockRepository::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlockedUserResponse> getBlockedUsers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return blockRepository.findByBlocker(user)
                .stream()
                .map(b -> BlockedUserResponse.builder()
                        .id(b.getId())
                        .blockedUser(UserResponse.fromEntity(b.getBlocked()))
                        .reason(b.getReason())
                        .blockedAt(b.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public ReportResponse reportUser(ReportUserRequest requestDto) {
        if (requestDto.getReporterId().equals(requestDto.getReportedId())) {
            throw new BadRequestException("You cannot report yourself.");
        }

        User reporter = userRepository.findById(requestDto.getReporterId())
                .orElseThrow(() -> new ResourceNotFoundException("Reporter not found with id: " + requestDto.getReporterId()));
        User reported = userRepository.findById(requestDto.getReportedId())
                .orElseThrow(() -> new ResourceNotFoundException("Reported user not found with id: " + requestDto.getReportedId()));

        if (reporter.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new ForbiddenException("Your account is suspended. You cannot submit reports.");
        }

        UserReport report = UserReport.builder()
                .reporter(reporter)
                .reported(reported)
                .reason(requestDto.getReason().trim())
                .details(requestDto.getDetails() != null ? requestDto.getDetails().trim() : null)
                .status(ReportStatus.PENDING)
                .build();

        UserReport saved = reportRepository.save(report);

        return ReportResponse.builder()
                .id(saved.getId())
                .reportedUserId(reported.getId())
                .reason(saved.getReason())
                .status(saved.getStatus())
                .reportedAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBlockedBetween(Long user1Id, Long user2Id) {
        User u1 = userRepository.findById(user1Id).orElse(null);
        User u2 = userRepository.findById(user2Id).orElse(null);
        if (u1 == null || u2 == null) return false;
        return blockRepository.isBlockedBetween(u1, u2);
    }
}
