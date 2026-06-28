package com.mangaverse.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Sliding-window rate limiter.
 *
 * FIX [05]: X-Forwarded-For is only honoured when the request arrives from a
 * known trusted proxy IP (app.rate-limit.trusted-proxies). When behind a trusted
 * proxy the LAST value in the XFF chain is used — that's the one the proxy appends
 * and the client cannot spoof. When not behind a trusted proxy, request.getRemoteAddr()
 * is used exclusively so a client cannot rotate IPs via a forged header.
 *
 * Single-instance only. For multi-instance deployments replace with bucket4j-redis.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;

    // Comma-separated list of trusted reverse-proxy IPs, e.g. "127.0.0.1,10.0.0.1"
    // Set via TRUSTED_PROXIES env var. Empty = no proxy, use remoteAddr directly.
    @Value("${app.rate-limit.trusted-proxies:}")
    private String trustedProxiesConfig;

    private volatile Set<String> trustedProxies = null;

    private record Bucket(long windowStart, AtomicInteger count) {}
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path   = request.getRequestURI();
        String method = request.getMethod();

        int limit = limitFor(path, method);
        if (limit > 0) {
            String key = clientKey(request) + "|" + path;
            if (!allow(key, limit)) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"error\":\"Too many requests. Please try again in a moment.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private int limitFor(String path, String method) {
        if (path.equals("/api/auth/login"))          return 10;
        if (path.equals("/api/auth/register"))       return 5;
        if (path.equals("/api/comics/suggestions"))  return 60;
        if ("POST".equals(method) && path.matches("/api/chapters/\\d+/comments")) return 30;
        return 0;
    }

    /**
     * FIX [05]: resolve client IP safely.
     *
     * - If remoteAddr is a trusted proxy → take the LAST entry in X-Forwarded-For
     *   (appended by the proxy itself; client cannot inject it).
     * - Otherwise → use remoteAddr directly, ignore X-Forwarded-For entirely.
     */
    private String clientKey(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        if (isTrustedProxy(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String[] parts = xff.split(",");
                // Last entry = the one added by our proxy; not spoofable by client.
                String proxySupplied = parts[parts.length - 1].trim();
                if (!proxySupplied.isBlank()) return proxySupplied;
            }
        }

        // Not behind a trusted proxy — or XFF was empty. Use the TCP-level address.
        return remoteAddr;
    }

    private boolean isTrustedProxy(String addr) {
        // Lazy-init the trusted-proxy set once.
        if (trustedProxies == null) {
            synchronized (this) {
                if (trustedProxies == null) {
                    Set<String> set = ConcurrentHashMap.newKeySet();
                    if (trustedProxiesConfig != null && !trustedProxiesConfig.isBlank()) {
                        for (String ip : trustedProxiesConfig.split(",")) {
                            String trimmed = ip.trim();
                            if (!trimmed.isEmpty()) set.add(trimmed);
                        }
                    }
                    trustedProxies = set;
                }
            }
        }
        return trustedProxies.contains(addr);
    }

    private boolean allow(String key, int limit) {
        long now = System.currentTimeMillis();
        Bucket bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart() >= WINDOW_MILLIS) {
                return new Bucket(now, new AtomicInteger(0));
            }
            return existing;
        });
        return bucket.count().incrementAndGet() <= limit;
    }
}
