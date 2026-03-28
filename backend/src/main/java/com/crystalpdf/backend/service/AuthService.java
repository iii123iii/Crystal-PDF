package com.crystalpdf.backend.service;

import com.crystalpdf.backend.entity.Document;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.DocumentRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final AppSettingsRepository appSettingsRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       DocumentRepository documentRepository,
                       StorageService storageService,
                       AppSettingsRepository appSettingsRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.appSettingsRepository = appSettingsRepository;
    }

    /** Accepts email OR username — tries email first, then username. */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));
    }

    /** Resolves an identifier (email or username) to the user's actual email. */
    public String resolveEmail(String identifier) {
        User user = (User) loadUserByUsername(identifier);
        return user.getEmail();
    }

    public String register(String email, String password) {
        AppSettings settings = appSettingsRepository.findById(1L).orElse(new AppSettings());
        if (!settings.isAllowRegistration()) {
            throw new IllegalArgumentException("Registration is currently disabled.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered.");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayUsername(generateUniqueUsername(email));
        userRepository.save(user);
        return jwtService.generateToken(user);
    }

    public String login(String identifier) {
        String email = resolveEmail(identifier);
        User user = getUserByEmail(email);
        return jwtService.generateToken(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private String generateUniqueUsername(String email) {
        String base = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        // Strip non-alphanumeric/underscore/hyphen chars
        base = base.replaceAll("[^a-zA-Z0-9_\\-]", "");
        if (base.isEmpty()) base = "user";
        if (!userRepository.existsByUsername(base)) return base;
        // Append incrementing suffix until unique
        for (int i = 2; i <= 9999; i++) {
            String candidate = base + i;
            if (!userRepository.existsByUsername(candidate)) return candidate;
        }
        return base + System.currentTimeMillis();
    }

    public void changePassword(User user, String currentPassword, String newPassword) {
        // Always verify current password — user must know it (admin provides temp password)
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangeRequired(false);
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password.");
        }
        // Delete all user documents (physical files) first
        List<Document> docs = documentRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId());
        for (Document doc : docs) {
            storageService.deleteFile(doc);
        }
        documentRepository.deleteAll(docs);
        userRepository.delete(user);
    }
}
