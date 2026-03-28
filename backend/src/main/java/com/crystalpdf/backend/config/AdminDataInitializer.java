package com.crystalpdf.backend.config;

import com.crystalpdf.backend.entity.AppSettings;
import com.crystalpdf.backend.entity.User;
import com.crystalpdf.backend.repository.AppSettingsRepository;
import com.crystalpdf.backend.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataInitializer {

    @Bean
    ApplicationRunner seedAdmin(UserRepository userRepo, PasswordEncoder encoder, AppSettingsRepository settingsRepo) {
        return args -> {
            // Create admin user only if no admin exists.
            // Once created, admin password is not auto-reset (prevent privilege escalation).
            // To recover a lost admin password, manually set a new one via database or admin console.
            boolean adminExists = userRepo.findAll().stream().anyMatch(User::isAdmin);
            if (!adminExists) {
                User admin = new User();
                admin.setEmail("admin@example.com");
                admin.setDisplayUsername("admin");
                // IMPORTANT: Change this password immediately after first deployment!
                admin.setPassword(encoder.encode("AdminChangeMe123!"));
                admin.setAdmin(true);
                admin.setPasswordChangeRequired(true);
                userRepo.save(admin);
                System.out.println("⚠️  Default admin created: email=admin@example.com, password=AdminChangeMe123! (CHANGE IMMEDIATELY)");
            }
            // Create default settings singleton if not exists
            if (!settingsRepo.existsById(1L)) {
                settingsRepo.save(new AppSettings());
            }
        };
    }
}
