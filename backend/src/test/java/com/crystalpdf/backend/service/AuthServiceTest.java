package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock AppSettingsRepository appSettingsRepository;
    @Mock DocumentRepository documentRepository;
    @Mock StorageService storageService;
    @Mock JwtService jwtService;

    // Use a real encoder so password matching works in unit tests
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, passwordEncoder, jwtService,
                documentRepository, storageService, appSettingsRepository);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User makeUser(String email, String rawPassword) {
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setDisplayUsername("testuser");
        return u;
    }

    private AppSettings openSettings() {
        AppSettings s = new AppSettings();
        s.setAllowRegistration(true);
        return s;
    }

    // ── loadUserByUsername ────────────────────────────────────────────────────

    @Test
    void loadUserByUsername_findsUserByEmail() {
        User user = makeUser("alice@example.com", "password");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        assertThat(authService.loadUserByUsername("alice@example.com")).isSameAs(user);
    }

    @Test
    void loadUserByUsername_fallsBackToUsername() {
        User user = makeUser("alice@example.com", "password");
        when(userRepository.findByEmail("alice")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));

        assertThat(authService.loadUserByUsername("alice")).isSameAs(user);
    }

    @Test
    void loadUserByUsername_throwsWhenNotFound() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.loadUserByUsername("nobody"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    void register_savesUserAndReturnsToken() {
        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(openSettings()));
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any())).thenReturn("mock-jwt");

        String token = authService.register("alice@example.com", "password123");

        assertThat(token).isEqualTo("mock-jwt");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(openSettings()));
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register("alice@example.com", "password123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void register_throwsWhenRegistrationDisabled() {
        AppSettings closed = new AppSettings();
        closed.setAllowRegistration(false);
        when(appSettingsRepository.findById(1L)).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> authService.register("alice@example.com", "password123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("disabled");
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePassword_updatesPasswordSuccessfully() {
        User user = makeUser("alice@example.com", "oldPass1");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.changePassword(user, "oldPass1", "newPass123");

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertThat(passwordEncoder.matches("newPass123", cap.getValue().getPassword())).isTrue();
        assertThat(cap.getValue().isPasswordChangeRequired()).isFalse();
    }

    @Test
    void changePassword_throwsOnWrongCurrentPassword() {
        User user = makeUser("alice@example.com", "correctPass");

        assertThatThrownBy(() -> authService.changePassword(user, "wrongPass", "newPass123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("incorrect");
    }

    @Test
    void changePassword_throwsWhenNewPasswordTooShort() {
        User user = makeUser("alice@example.com", "correctPass");

        assertThatThrownBy(() -> authService.changePassword(user, "correctPass", "short"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8 characters");
    }

    // ── deleteAccount ─────────────────────────────────────────────────────────

    @Test
    void deleteAccount_deletesFilesAndUser() throws Exception {
        User user = makeUser("alice@example.com", "correctPass");
        Document doc = new Document();
        when(documentRepository.findByOwnerIdOrderByCreatedAtDesc(any())).thenReturn(Collections.singletonList(doc));

        authService.deleteAccount(user, "correctPass");

        verify(storageService).deleteFile(doc);
        verify(documentRepository).deleteAll(anyList());
        verify(userRepository).delete(user);
    }

    @Test
    void deleteAccount_throwsOnWrongPassword() {
        User user = makeUser("alice@example.com", "correctPass");

        assertThatThrownBy(() -> authService.deleteAccount(user, "wrongPass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Incorrect password");
    }
}
