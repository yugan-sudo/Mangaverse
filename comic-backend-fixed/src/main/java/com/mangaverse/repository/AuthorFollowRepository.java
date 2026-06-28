package com.mangaverse.repository;

import com.mangaverse.entity.AuthorFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface AuthorFollowRepository extends JpaRepository<AuthorFollow, Long> {
    List<AuthorFollow> findByUserId(Long userId);
    boolean existsByUserIdAndAuthorName(Long userId, String authorName);
    @Transactional
    void deleteByUserIdAndAuthorName(Long userId, String authorName);
}
