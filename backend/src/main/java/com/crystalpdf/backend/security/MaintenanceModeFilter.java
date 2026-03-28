package com.crystalpdf.backend.security;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Blocks non-admin users when maintenance mode is on.
 * Auth and health endpoints are always allowed through.
 */
@Component
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final AppSettingsRepository appSettingsRepository;

    public MaintenanceModeFilter(AppSettingsRepository appSettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Always allow auth and health endpoints
        if (path.startsWith("/api/auth") || path.startsWith("/api/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        AppSettings settings = appSettingsRepository.findById(1L).orElse(null);
        if (settings != null && settings.isMaintenanceMode()) {
            // Check if user is admin
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = false;
            if (auth != null && auth.getPrincipal() instanceof User user) {
                isAdmin = user.isAdmin();
            }
            if (!isAdmin) {
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"The platform is currently under maintenance. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
