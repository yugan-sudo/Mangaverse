package com.mangaverse.repository;
import com.mangaverse.entity.ChapterReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ChapterReactionRepository extends JpaRepository<ChapterReaction, Long> {
    @Query("SELECT r.reactionType, COUNT(r) FROM ChapterReaction r WHERE r.chapterId = :chapterId GROUP BY r.reactionType")
    List<Object[]> countByChapterId(Long chapterId);
    Optional<ChapterReaction> findByUserIdAndChapterIdAndReactionType(Long userId, Long chapterId, String type);
    List<ChapterReaction> findByUserIdAndChapterId(Long userId, Long chapterId);
}
