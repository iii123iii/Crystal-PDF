package com.crystalpdf.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiter for auth endpoints (login, register).
 * Limits each IP to 10 attempts per 15 minutes.
 * For production, use a distributed cache (Redis) and external rate limiting service.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000L; // 15 minutes
    private static final long CLEANUP_INTERVAL_MS = 60 * 60 * 1000L; // 1 hour

    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    private volatile long lastCleanupTime = System.currentTimeMillis();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // Only rate limit auth endpoints
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            String clientIp = getClientIp(request);
            if (!isAllowed(clientIp)) {
                response.setStatus(429); // HTTP 429 Too Many Requests
                response.getWriter().write("{\"error\":\"Too many requests. Try again later.\"}");
                return;
            }
            recordAttempt(clientIp);
        }

        chain.doFilter(request, response);
    }

    private boolean isAllowed(String clientIp) {
        RateLimitBucket bucket = buckets.get(clientIp);
        if (bucket == null || bucket.isExpired()) {
            return true;
        }
        return bucket.getAttemptCount() < MAX_ATTEMPTS;
    }

    private void recordAttempt(String clientIp) {
        buckets.computeIfAbsent(clientIp, ip -> new RateLimitBucket())
                .recordAttempt();
        // Periodic cleanup of expired buckets
        if (System.currentTimeMillis() - lastCleanupTime > CLEANUP_INTERVAL_MS) {
            buckets.entrySet().removeIf(e -> e.getValue().isExpired());
            lastCleanupTime = System.currentTimeMillis();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for X-Forwarded-For header (when behind a proxy)
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ── Bucket ────────────────────────────────────────────────────────────────

    private static class RateLimitBucket {
        private int attemptCount = 0;
        private long createdAt = System.currentTimeMillis();

        void recordAttempt() {
            attemptCount++;
        }

        int getAttemptCount() {
            return attemptCount;
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > WINDOW_MS;
        }
    }
}
