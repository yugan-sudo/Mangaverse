package com.mangaverse.repository;

import com.mangaverse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query(
        "SELECT FUNCTION('DATE', u.createdAt), COUNT(u) FROM User u WHERE u.createdAt >= :since GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY FUNCTION('DATE', u.createdAt)")
    java.util.List<Object[]> registrationsByDay(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    long countByCreatedAtAfter(java.time.LocalDateTime since);

}
