package com.mangaverse.repository;

import com.mangaverse.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByComicIdOrderByChapterNumberAsc(Long comicId);
    long countByComicId(Long comicId);
    @Transactional void deleteByComicId(Long comicId);

    // FIX [07/ZipUpload]: replaces findAll().stream().anyMatch(...) — targeted query.
    boolean existsByComicIdAndChapterNumber(Long comicId, Integer chapterNumber);

    @Query("SELECT c FROM Chapter c WHERE c.scheduledAt IS NOT NULL AND c.scheduledAt BETWEEN :from AND :to ORDER BY c.scheduledAt ASC")
    List<Chapter> findScheduled(@Param("from") java.time.LocalDateTime from,
                                @Param("to")   java.time.LocalDateTime to);

    @Query("SELECT FUNCTION('DATE', c.createdAt), COUNT(c) FROM Chapter c WHERE c.createdAt >= :since GROUP BY FUNCTION('DATE', c.createdAt) ORDER BY FUNCTION('DATE', c.createdAt)")
    List<Object[]> uploadsByDay(@Param("since") java.time.LocalDateTime since);

    @Query(value = "SELECT c.id, c.chapter_number, comic.title, COUNT(rp.id) AS read_count " +
                   "FROM reading_progress rp " +
                   "JOIN chapters c ON c.id = rp.last_chapter_id " +
                   "JOIN comics comic ON comic.id = c.comic_id " +
                   "GROUP BY c.id, c.chapter_number, comic.title " +
                   "ORDER BY read_count DESC",
           countQuery = "SELECT COUNT(*) FROM (" +
                        "SELECT c.id FROM reading_progress rp " +
                        "JOIN chapters c ON c.id = rp.last_chapter_id GROUP BY c.id) AS sub",
           nativeQuery = true)
    List<Object[]> mostReadChapters(org.springframework.data.domain.Pageable pageable);
}
