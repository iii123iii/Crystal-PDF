package com.crystalpdf.backend.controller;

import com.crystalpdf.backend.dto.AuthRequest;
import com.crystalpdf.backend.dto.AuthResponse;
import com.crystalpdf.backend.dto.ChangePasswordRequest;
import com.crystalpdf.backend.dto.DeleteAccountRequest;
import com.crystalpdf.backend.dto.LoginRequest;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.service.AuthService;
import com.crystalpdf.backend.service.StorageService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** Cookie name must match JwtAuthFilter.AUTH_COOKIE */
    private static final String AUTH_COOKIE = "auth_token";
    /** 24 hours — must be <= JWT expiration-ms / 1000 */
    private static final int COOKIE_MAX_AGE_SECONDS = 86400;

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final StorageService storageService;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager,
                          StorageService storageService) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.storageService = storageService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest req,
                                                  HttpServletResponse response) {
        String token = authService.register(req.email(), req.password());
        setAuthCookie(response, token);
        User user = authService.getUserByEmail(req.email());
        return ResponseEntity.ok(new AuthResponse(user.getEmail(), user.isAdmin(), user.isPasswordChangeRequired()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req,
                                               HttpServletResponse response) {
        // Resolve identifier → email so AuthenticationManager can look up the user
        String email = authService.resolveEmail(req.identifier());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.password())
        );
        String token = authService.login(email);
        User user = authService.getUserByEmail(email);
        setAuthCookie(response, token);
        return ResponseEntity.ok(new AuthResponse(user.getEmail(), user.isAdmin(), user.isPasswordChangeRequired()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearAuthCookie(response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal User user) {
        authService.changePassword(user, req.currentPassword(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/storage")
    public ResponseEntity<java.util.Map<String, Long>> getStorage(@AuthenticationPrincipal User user) {
        long[] info = storageService.getStorageInfo(user);
        return ResponseEntity.ok(java.util.Map.of("usedBytes", info[0], "limitBytes", info[1]));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(
            @RequestBody DeleteAccountRequest req,
            @AuthenticationPrincipal User user,
            HttpServletResponse response) {
        authService.deleteAccount(user, req.password());
        clearAuthCookie(response);
        return ResponseEntity.noContent().build();
    }

    private void setAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(AUTH_COOKIE, token);
        cookie.setHttpOnly(true);  // Not accessible to JavaScript — protects against XSS token theft
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_MAX_AGE_SECONDS);
        // cookie.setSecure(true); // Uncomment for production (HTTPS only)
        response.addCookie(cookie);
    }

    private void clearAuthCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(AUTH_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
