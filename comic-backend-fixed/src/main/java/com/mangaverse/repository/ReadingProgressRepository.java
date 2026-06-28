package com.mangaverse.repository;

import com.mangaverse.entity.ReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {
    Optional<ReadingProgress> findByUserIdAndComicId(Long userId, Long comicId);
    List<ReadingProgress> findByUserIdOrderByUpdatedAtDesc(Long userId);

    // Distinct user IDs that have any reading progress
    @org.springframework.data.jpa.repository.Query(
        "SELECT DISTINCT rp.user.id FROM ReadingProgress rp")
    List<Long> findDistinctUserIds();

    // Sum of chaptersRead grouped by user
    @org.springframework.data.jpa.repository.Query(
        "SELECT rp.user.id, SUM(rp.chaptersRead) FROM ReadingProgress rp GROUP BY rp.user.id")
    List<Object[]> totalChaptersReadByUser();

    // Pairs of (userId, updatedAt) for retention calculations
    @org.springframework.data.jpa.repository.Query(
        "SELECT rp.user.id, MAX(rp.updatedAt) FROM ReadingProgress rp GROUP BY rp.user.id")
    List<Object[]> lastActivityByUser();
}
