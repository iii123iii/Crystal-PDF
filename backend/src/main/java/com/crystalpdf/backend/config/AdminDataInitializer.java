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
            // Create admin user if no admin exists
            boolean adminExists = userRepo.findAll().stream().anyMatch(User::isAdmin);
            if (!adminExists) {
                User admin = new User();
                admin.setEmail("admin");
                admin.setDisplayUsername("admin");
                admin.setPassword(encoder.encode("admin"));
                admin.setAdmin(true);
                admin.setPasswordChangeRequired(true);
                userRepo.save(admin);
            } else {
                // If admin exists and is locked out (passwordChangeRequired + unknown password),
                // reset to default credentials so they can log back in
                userRepo.findByEmail("admin").ifPresent(admin -> {
                    if (admin.isAdmin() && admin.isPasswordChangeRequired()) {
                        admin.setPassword(encoder.encode("admin"));
                        userRepo.save(admin);
                    }
                });
            }
            // Create default settings singleton if not exists
            if (!settingsRepo.existsById(1L)) {
                settingsRepo.save(new AppSettings());
            }
        };
    }
}
