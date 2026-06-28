package com.mangaverse.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    // FIX [01]: validate secret at startup — fail loud rather than silently use a weak key.
    @PostConstruct
    public void validateSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "[Security] app.jwt.secret is not set. Set the JWT_SECRET environment variable " +
                "(minimum 32 characters). Generate one with: openssl rand -base64 48");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "[Security] app.jwt.secret is too short — minimum 32 bytes required for HS256. " +
                "Current length: " + secret.getBytes(StandardCharsets.UTF_8).length + " bytes.");
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // FIX [02]: embed a unique jti (JWT ID) claim so tokens can be individually revoked.
    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .id(UUID.randomUUID().toString())   // jti — used by TokenBlocklist
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key())
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // FIX [02]: expose jti so JwtFilter can check the blocklist.
    public String extractJti(String token) {
        return getClaims(token).getId();
    }

    public Date extractExpiration(String token) {
        return getClaims(token).getExpiration();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
