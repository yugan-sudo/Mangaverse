package com.mangaverse.repository;

import com.mangaverse.entity.ComicLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface ComicLikeRepository extends JpaRepository<ComicLike, Long> {
    boolean existsByUserIdAndComicId(Long userId, Long comicId);
    @Transactional void deleteByUserIdAndComicId(Long userId, Long comicId);
    @Transactional void deleteByComicId(Long comicId); // for cascade comic delete
    long countByComicId(Long comicId);
}
