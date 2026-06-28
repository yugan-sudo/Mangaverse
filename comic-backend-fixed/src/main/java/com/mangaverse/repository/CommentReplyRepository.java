package com.mangaverse.repository;

import com.mangaverse.entity.CommentReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface CommentReplyRepository extends JpaRepository<CommentReply, Long> {
    // Get all replies for a comment, oldest first (chronological threading)
    List<CommentReply> findByCommentIdOrderByCreatedAtAsc(Long commentId);

    @Transactional
    void deleteByIdAndUserId(Long id, Long userId);
}
