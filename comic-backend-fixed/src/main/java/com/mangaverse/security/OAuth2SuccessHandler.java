package com.mangaverse.security;

import com.mangaverse.entity.User;
import com.mangaverse.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.jwt.expiration:86400000}")
    private int jwtExpirationMs;

    public OAuth2SuccessHandler(JwtUtil jwtUtil, UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
            user = User.builder()
                    .email(email)
                    .username(baseUsername + UUID.randomUUID().toString().substring(0, 4))
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // dummy password
                    .role(User.Role.USER)
                    .build();
            user.setDisplayName(name);
            if (picture != null) user.setAvatar(picture);
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUsername());
        
        response.setHeader("Set-Cookie",
            String.format("jwt=%s; Max-Age=%d; Path=/; HttpOnly; %sSameSite=None",
                token, jwtExpirationMs / 1000, cookieSecure ? "Secure; " : ""));

        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/");
    }
}
