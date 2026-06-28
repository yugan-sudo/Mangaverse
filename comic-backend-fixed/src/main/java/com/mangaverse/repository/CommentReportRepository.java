package com.mangaverse.repository;

import com.mangaverse.entity.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    List<CommentReport> findByStatusOrderByCreatedAtDesc(String status);
    List<CommentReport> findAllByOrderByCreatedAtDesc();
    boolean existsByReporterIdAndCommentId(Long reporterId, Long commentId);
    long countByStatus(String status);

    // FIX [Bug 2]: delete all reports referencing a comment before the comment
    // itself is deleted. Without this, MySQL fires:
    //   FK constraint fails (`comment_reports`.`comment_id` REFERENCES `comments`.`id`)
    // Used by CommentController (user deletes own comment) and
    // CommentReportController.deleteReportedComment (admin deletes via report).
    @Transactional
    void deleteByCommentId(Long commentId);
}
