package com.crystalpdf.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSize(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(413)
                .body(Map.of("error", "File too large. Maximum allowed size is 200 MB per file."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }

    /** Wrong password or user not found during login — return 401 with a safe message. */
    @ExceptionHandler({ BadCredentialsException.class, UsernameNotFoundException.class, AuthenticationException.class })
    public ResponseEntity<Map<String, String>> handleAuthFailure(RuntimeException e) {
        return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid email/username or password."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "An unexpected error occurred. Please try again."));
    }
}
