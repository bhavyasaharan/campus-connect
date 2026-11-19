package com.campusconnect.security;

import com.campusconnect.model.AdminRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expiration;

    public JwtService(
            @Value("${jwt.secret:default-secret-key-that-is-at-least-384-bits-long-for-campus-connect-security-2026-production}") String secret,
            @Value("${jwt.expiration:86400000}") long expiration
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    public String generateToken(Long userId, String username, String instagramScopedUserId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("igsid", instagramScopedUserId)
                .claim("role", "STUDENT")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    public String generateAdminToken(Long adminId, String username, AdminRole role) {
        return generateAdminToken(adminId, username, role != null ? role.name() : AdminRole.ADMIN.name());
    }

    public String generateAdminToken(Long adminId, String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(adminId.toString())
                .claim("username", username)
                .claim("role", role)
                .claim("isAdmin", true)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    public boolean isAdminToken(String token) {
        try {
            Claims claims = parseToken(token);
            Boolean isAdmin = claims.get("isAdmin", Boolean.class);
            return Boolean.TRUE.equals(isAdmin);
        } catch (Exception e) {
            return false;
        }
    }

    public Long extractUserId(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    public String extractUsername(String token) {
        Claims claims = parseToken(token);
        return claims.get("username", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
