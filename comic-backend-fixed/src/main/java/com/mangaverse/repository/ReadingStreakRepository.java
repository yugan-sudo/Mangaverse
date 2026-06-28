package com.mangaverse.repository;

import com.mangaverse.entity.ReadingStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReadingStreakRepository extends JpaRepository<ReadingStreak, Long> {
    Optional<ReadingStreak> findByUserId(Long userId);
}
