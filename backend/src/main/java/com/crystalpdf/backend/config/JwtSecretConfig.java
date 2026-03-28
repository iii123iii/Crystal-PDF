package com.crystalpdf.backend.config;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Generates or provides the JWT signing secret.
 * If JWT_SECRET env var is not set, a random 256-bit secret is auto-generated.
 * The generated secret is used for the current session only (not persisted).
 * For multi-instance deployments, set JWT_SECRET env var to the same value on all instances.
 */
@Configuration
public class JwtSecretConfig {

    private static final int SECRET_BYTES = 32; // 256 bits for HMAC-SHA256

    @Bean
    @Primary
    public JwtSecretProvider jwtSecretProvider(
            @Value("${crystalpdf.jwt.secret:}") String configuredSecret) {
        String secret = configuredSecret.isBlank()
                ? generateRandomSecret()
                : configuredSecret;
        return new JwtSecretProvider(secret);
    }

    private static String generateRandomSecret() {
        byte[] randomBytes = new byte[SECRET_BYTES];
        new SecureRandom().nextBytes(randomBytes);
        String encoded = Base64.getEncoder().encodeToString(randomBytes);
        System.out.println("⚠️  JWT secret auto-generated (not persisted). " +
                "For production with multiple instances, set JWT_SECRET env var.");
        return encoded;
    }

    public static class JwtSecretProvider {
        private final String secret;

        public JwtSecretProvider(String secret) {
            this.secret = secret;
        }

        public String getSecret() {
            return secret;
        }
    }
}
