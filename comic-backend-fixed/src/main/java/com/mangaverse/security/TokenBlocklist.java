package com.mangaverse.security;

import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * FIX [02]: In-memory JWT revocation blocklist.
 *
 * Stores revoked token JTIs with their expiry timestamp.
 * A background thread prunes expired entries every 10 minutes to prevent unbounded growth.
 *
 * For multi-instance / horizontally scaled deployments, replace this with a
 * Redis-backed implementation:
 *   redisTemplate.opsForValue().set("jti:" + jti, "1", ttlMillis, TimeUnit.MILLISECONDS);
 *   return redisTemplate.hasKey("jti:" + jti);
 */
@Component
public class TokenBlocklist {

    // jti → expiry epoch millis
    private final Map<String, Long> blockedJtis = new ConcurrentHashMap<>();

    public TokenBlocklist() {
        // Prune expired entries every 10 minutes so the map doesn't grow forever.
        Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "jwt-blocklist-pruner");
            t.setDaemon(true);
            return t;
        }).scheduleAtFixedRate(this::pruneExpired, 10, 10, TimeUnit.MINUTES);
    }

    /** Revoke a token by its jti until its natural expiry time. */
    public void revoke(String jti, Date expiry) {
        if (jti != null && expiry != null) {
            blockedJtis.put(jti, expiry.getTime());
        }
    }

    /** Returns true if this jti has been explicitly revoked and has not yet expired. */
    public boolean isRevoked(String jti) {
        if (jti == null) return false;
        Long expiryMillis = blockedJtis.get(jti);
        if (expiryMillis == null) return false;
        // If the token has naturally expired, treat it as not revoked
        // (it would be rejected by signature/expiry check anyway).
        return System.currentTimeMillis() < expiryMillis;
    }

    private void pruneExpired() {
        long now = System.currentTimeMillis();
        blockedJtis.entrySet().removeIf(e -> e.getValue() <= now);
    }
}
