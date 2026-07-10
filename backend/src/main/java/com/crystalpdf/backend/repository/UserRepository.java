package com.crystalpdf.backend.repository;

import com.crystalpdf.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    long countByAdminTrue();

    @Query("""
            select u from User u
            where (:search is null
                or lower(u.email) like :search
                or lower(coalesce(u.username, '')) like :search)
            and (:adminOnly is null or u.admin = :adminOnly)
            """)
    Page<User> findForAdminList(@Param("search") String search,
                                @Param("adminOnly") Boolean adminOnly,
                                Pageable pageable);
}
