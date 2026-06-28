package com.mangaverse.repository;

import com.mangaverse.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByComicIdOrderByCreatedAtDesc(Long comicId);
    @Transactional void deleteByIdAndUserId(Long id, Long userId);
    @Transactional void deleteByComicId(Long comicId); // for cascade comic delete
}
