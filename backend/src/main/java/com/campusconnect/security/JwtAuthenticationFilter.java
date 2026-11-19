package com.campusconnect.security;

import com.campusconnect.constant.AppConstants;
import com.campusconnect.model.AdminUser;
import com.campusconnect.model.User;
import com.campusconnect.repository.AdminUserRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader(AppConstants.AUTH_HEADER);

        if (authHeader == null || !authHeader.startsWith(AppConstants.BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(AppConstants.BEARER_PREFIX.length());

        try {
            if (jwtService.isTokenValid(jwt)) {
                Long id = jwtService.extractUserId(jwt);

                if (id != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (jwtService.isAdminToken(jwt)) {
                        Optional<AdminUser> adminOptional = adminUserRepository.findById(id);
                        if (adminOptional.isPresent()) {
                            AdminUser admin = adminOptional.get();
                            if (admin.isActive()) {
                                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                        admin,
                                        null,
                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                                );
                                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(authToken);
                            }
                        }
                    } else {
                        Optional<User> userOptional = userRepository.findById(id);
                        if (userOptional.isPresent()) {
                            User user = userOptional.get();
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                            );
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("JWT authentication filter error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
