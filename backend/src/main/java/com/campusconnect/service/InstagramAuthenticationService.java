package com.campusconnect.service;

import com.campusconnect.dto.response.AuthResponse;
import com.campusconnect.model.InstagramVerification;

public interface InstagramAuthenticationService {

    AuthResponse completeInstagramLoginOrRegistration(
            InstagramVerification verification,
            String instagramScopedUserId,
            String verifiedUsername
    );

    AuthResponse loginWithVerifiedChallenge(String challengeId);
}
