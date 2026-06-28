package com.mangaverse.repository;

import com.mangaverse.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndComicId(Long userId, Long comicId);
    long countByComicId(Long comicId);
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.comic.id = :comicId")
    Double findAverageByComicId(@Param("comicId") Long comicId);
    @Transactional void deleteByComicId(Long comicId); // for cascade comic delete
}
