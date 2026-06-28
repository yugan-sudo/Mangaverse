package com.mangaverse.repository;

import com.mangaverse.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByComicIdOrderByHelpfulCountDescCreatedAtDesc(Long comicId);
    Optional<Review> findByUserIdAndComicId(Long userId, Long comicId);
    boolean existsByUserIdAndComicId(Long userId, Long comicId);
    @Query("SELECT AVG(r.stars) FROM Review r WHERE r.comic.id = :comicId")
    Double averageByComicId(Long comicId);
    long countByComicId(Long comicId);
}
