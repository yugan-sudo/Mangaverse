package com.mangaverse.repository;

import com.mangaverse.entity.ChapterComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ChapterCommentRepository extends JpaRepository<ChapterComment, Long> {

    // Get all comments for a chapter, newest first
    List<ChapterComment> findByChapterIdOrderByCreatedAtDesc(Long chapterId);

    // Delete only the owner's comment (prevents deleting others' comments)
    @Transactional
    void deleteByIdAndUserId(Long id, Long userId);
}
