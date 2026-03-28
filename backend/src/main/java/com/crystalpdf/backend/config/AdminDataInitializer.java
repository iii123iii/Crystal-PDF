package com.crystalpdf.backend.config;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataInitializer {

    @Bean
    ApplicationRunner seedAdmin(
            UserRepository userRepo,
            PasswordEncoder encoder,
            AppSettingsRepository settingsRepo,
            @Value("${crystalpdf.admin.email}") String adminEmail,
            @Value("${crystalpdf.admin.password}") String adminPassword) {
        return args -> {
            // Create admin user only if no admin exists.
            // Credentials are read from application.yml (environment-configurable).
            // Once created, admin password is not auto-reset (prevent privilege escalation).
            // To recover a lost admin password, manually set a new one via database or admin console.
            boolean adminExists = userRepo.findAll().stream().anyMatch(User::isAdmin);
            if (!adminExists) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setDisplayUsername("admin");
                admin.setPassword(encoder.encode(adminPassword));
                admin.setAdmin(true);
                admin.setPasswordChangeRequired(true);
                userRepo.save(admin);
                System.out.println("⚠️  Default admin created: email=" + adminEmail + " (Change password immediately!)");
            }
            // Create default settings singleton if not exists
            if (!settingsRepo.existsById(1L)) {
                settingsRepo.save(new AppSettings());
            }
        };
    }
}
