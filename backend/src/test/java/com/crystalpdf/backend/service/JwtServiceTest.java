package com.crystalpdf.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // Base64-encoded 256-bit key (same as application.yml dev default)
    private static final String SECRET =
            "Y3J5c3RhbHBkZi12Mi1qd3Qtc2VjcmV0LWtleS1wbGVhc2UtY2hhbmdlLWluLXByb2R1Y3Rpb24=";
    private static final long EXPIRATION_MS = 86_400_000L; // 24 h

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", EXPIRATION_MS);
    }

    private UserDetails userOf(String email) {
        return User.withUsername(email)
                .password("irrelevant")
                .authorities(Collections.emptyList())
                .build();
    }

    @Test
    void generateToken_returnsNonBlankString() {
        String token = jwtService.generateToken(userOf("alice@example.com"));
        assertThat(token).isNotBlank();
    }

    @Test
    void generateToken_containsThreeJwtParts() {
        String token = jwtService.generateToken(userOf("alice@example.com"));
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void extractUsername_returnsSubject() {
        String email = "alice@example.com";
        String token = jwtService.generateToken(userOf(email));
        assertThat(jwtService.extractUsername(token)).isEqualTo(email);
    }

    @Test
    void isTokenValid_trueForFreshToken() {
        UserDetails user = userOf("alice@example.com");
        String token = jwtService.generateToken(user);
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    void isTokenValid_falseForWrongUser() {
        String token = jwtService.generateToken(userOf("alice@example.com"));
        assertThat(jwtService.isTokenValid(token, userOf("bob@example.com"))).isFalse();
    }

    @Test
    void isTokenValid_falseForExpiredToken() throws Exception {
        // Create a service whose tokens expire immediately
        JwtService shortLived = new JwtService();
        ReflectionTestUtils.setField(shortLived, "secret", SECRET);
        ReflectionTestUtils.setField(shortLived, "expirationMs", 1L); // 1 ms
        UserDetails user = userOf("alice@example.com");
        String token = shortLived.generateToken(user);
        Thread.sleep(10); // let it expire
        assertThat(shortLived.isTokenValid(token, user)).isFalse();
    }

    @Test
    void isTokenValid_falseForTamperedToken() {
        UserDetails user = userOf("alice@example.com");
        String token = jwtService.generateToken(user);
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "tampered";
        assertThat(jwtService.isTokenValid(tampered, user)).isFalse();
    }

    @Test
    void extractUsername_throwsForGarbageInput() {
        assertThatThrownBy(() -> jwtService.extractUsername("not.a.token"))
                .isInstanceOf(Exception.class);
    }
}
