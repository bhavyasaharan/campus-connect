package com.campusconnect.service;

import com.campusconnect.dto.response.InstagramChallengeResponse;
import com.campusconnect.dto.response.InstagramVerificationStatusResponse;

public interface InstagramVerificationService {

    InstagramChallengeResponse createChallenge(String rawUsername);

    InstagramChallengeResponse resendOtp(String challengeId);

    InstagramVerificationStatusResponse getVerificationStatus(String challengeId);

    void processIncomingMessage(String senderIgsid, String actualSenderUsername, String messageText);
}
