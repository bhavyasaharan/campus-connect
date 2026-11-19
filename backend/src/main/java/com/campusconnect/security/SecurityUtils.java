package com.campusconnect.security;

import com.campusconnect.exception.UnauthorizedException;
import com.campusconnect.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

/**
 * Utility class for retrieving the authenticated student entity and user ID
 * established by the JwtAuthenticationFilter within Spring Security's SecurityContext.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // Private constructor for utility class
    }

    /**
     * Retrieves the currently authenticated User entity from the SecurityContext, if present.
     */
    public static Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    /**
     * Retrieves the currently authenticated User ID from the SecurityContext, if present.
     */
    public static Optional<Long> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return Optional.ofNullable(user.getId());
        }
        if (principal instanceof Long id) {
            return Optional.of(id);
        }
        if (principal instanceof String strId) {
            try {
                return Optional.of(Long.parseLong(strId));
            } catch (NumberFormatException ignored) {
                // Ignore non-numeric strings (such as "anonymousUser")
            }
        }
        if (principal instanceof UserDetails ud) {
            try {
                return Optional.of(Long.parseLong(ud.getUsername()));
            } catch (NumberFormatException ignored) {
                // Ignore non-numeric usernames
            }
        }
        return Optional.empty();
    }

    /**
     * Retrieves the currently authenticated User ID or throws UnauthorizedException (401).
     */
    public static Long getRequiredCurrentUserId() {
        return getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedException("User not authenticated. Please log in or provide a valid Bearer token."));
    }

    /**
     * Retrieves the currently authenticated User entity or throws UnauthorizedException (401).
     */
    public static User getRequiredCurrentUser() {
        return getCurrentUser()
                .orElseThrow(() -> new UnauthorizedException("User not authenticated. Please log in or provide a valid Bearer token."));
    }

    /**
     * Resolves the authenticated user ID from an explicit Authentication parameter,
     * or from SecurityContextHolder if the parameter is null.
     */
    public static Long getUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User user) {
                return user.getId();
            } else if (principal instanceof Long id) {
                return id;
            } else if (principal instanceof String strId) {
                try {
                    return Long.parseLong(strId);
                } catch (NumberFormatException ignored) {}
            }
        }
        return getRequiredCurrentUserId();
    }

    /**
     * Resolves the user ID by prioritizing the authenticated user from the JWT security filter,
     * falling back to the supplied parameter if unauthenticated (e.g. for backward compatibility).
     */
    public static Long resolveUserId(Long fallbackUserId) {
        return getCurrentUserId().orElse(fallbackUserId);
    }
}
