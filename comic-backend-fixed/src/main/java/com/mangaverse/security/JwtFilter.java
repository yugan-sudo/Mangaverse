package com.mangaverse.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Arrays;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil          jwtUtil;
    private final UserDetailsService userDetailsService;
    private final TokenBlocklist   blocklist;

    public JwtFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService,
                     TokenBlocklist blocklist) {
        this.jwtUtil          = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.blocklist        = blocklist;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // FIX [03]: prefer HttpOnly cookie over Authorization header.
        // Cookie is inaccessible to JavaScript — immune to XSS token theft.
        // Authorization header is still accepted as fallback for API clients / mobile.
        String token = extractFromCookie(request);
        if (token == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }

        if (token == null) {
            chain.doFilter(request, response);
            return;
        }

        String username = null;
        String jti      = null;

        try {
            username = jwtUtil.extractUsername(token);
            jti      = jwtUtil.extractJti(token);
        } catch (Exception e) {
            unauthorised(response, "Token expired or invalid. Please login again.");
            return;
        }

        // FIX [02]: check revocation blocklist — covers explicit logout.
        if (blocklist.isRevoked(jti)) {
            unauthorised(response, "Token has been revoked. Please login again.");
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails ud = userDetailsService.loadUserByUsername(username);
                if (jwtUtil.validateToken(token, ud)) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    unauthorised(response, "Session expired. Please login again.");
                    return;
                }
            } catch (Exception e) {
                unauthorised(response, "User not found. Please login again.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    // FIX [03]: read JWT from the HttpOnly cookie named "jwt".
    private String extractFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "jwt".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void unauthorised(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
