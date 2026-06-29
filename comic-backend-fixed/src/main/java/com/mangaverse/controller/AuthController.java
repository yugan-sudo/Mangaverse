package com.mangaverse.controller;

import com.mangaverse.entity.User;
import com.mangaverse.repository.UserRepository;
import com.mangaverse.security.JwtUtil;
import com.mangaverse.security.TokenBlocklist;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil               jwtUtil;
    private final TokenBlocklist        blocklist;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.jwt.expiration:86400000}")
    private int jwtExpirationMs;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          AuthenticationManager authManager, JwtUtil jwtUtil,
                          TokenBlocklist blocklist) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authManager     = authManager;
        this.jwtUtil         = jwtUtil;
        this.blocklist       = blocklist;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken."));
        if (userRepository.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered."));
        User user = User.builder()
                .username(req.getUsername()).email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.USER).build();
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse response) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            String token = jwtUtil.generateToken(req.getUsername());
            User   user  = userRepository.findByUsername(req.getUsername()).orElseThrow();
            setJwtCookie(response, token);
            // FIX: return the full user object so the frontend can populate
            // AuthContext.user immediately — no extra /auth/me round-trip needed.
            return ResponseEntity.ok(Map.of(
                "username",    user.getUsername(),
                "role",        user.getRole().name(),
                "email",       user.getEmail()       != null ? user.getEmail()       : "",
                "avatar",      user.getAvatar()       != null ? user.getAvatar()       : "",
                "displayName", user.getDisplayName()  != null ? user.getDisplayName()  : user.getUsername()
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password."));
        }
    }

    // FIX: /api/auth/me now returns avatar + displayName so AuthContext.user
    // always has up-to-date profile data after refreshUser() is called.
    @GetMapping("/me")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated."));
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "User not found."));
        return ResponseEntity.ok(Map.of(
            "username",    user.getUsername(),
            "role",        user.getRole().name(),
            "email",       user.getEmail()       != null ? user.getEmail()       : "",
            // FIX: include avatar and displayName so the frontend can render the
            // correct avatar everywhere without a separate /me/profile call.
            "avatar",      user.getAvatar()       != null ? user.getAvatar()       : "",
            "displayName", user.getDisplayName()  != null ? user.getDisplayName()  : user.getUsername()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extractToken(request);
        if (token != null) {
            try { blocklist.revoke(jwtUtil.extractJti(token), jwtUtil.extractExpiration(token)); }
            catch (Exception ignored) {}
        }
        clearJwtCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    // ─── Cookie helpers ──────────────────────────────────────────────────
    private void setJwtCookie(HttpServletResponse response, String token) {
        response.setHeader("Set-Cookie",
            String.format("jwt=%s; Max-Age=%d; Path=/; HttpOnly; %sSameSite=Lax",
                token, jwtExpirationMs / 1000, cookieSecure ? "Secure; " : ""));
    }

    private void clearJwtCookie(HttpServletResponse response) {
        response.setHeader("Set-Cookie",
            String.format("jwt=; Max-Age=0; Path=/; HttpOnly; %sSameSite=Lax",
                cookieSecure ? "Secure; " : ""));
    }

    private String extractToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies())
                if ("jwt".equals(c.getName())) return c.getValue();
        }
        String h = request.getHeader("Authorization");
        return (h != null && h.startsWith("Bearer ")) ? h.substring(7) : null;
    }

    // ─── DTOs ────────────────────────────────────────────────────────────
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 50) private String username;
        @NotBlank @Email                   private String email;
        @NotBlank @Size(min = 8)           private String password;
        public String getUsername() { return username; } public void setUsername(String v) { this.username = v; }
        public String getEmail()    { return email; }    public void setEmail(String v)    { this.email = v; }
        public String getPassword() { return password; } public void setPassword(String v) { this.password = v; }
    }

    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
        public String getUsername() { return username; } public void setUsername(String v) { this.username = v; }
        public String getPassword() { return password; } public void setPassword(String v) { this.password = v; }
    }
}
