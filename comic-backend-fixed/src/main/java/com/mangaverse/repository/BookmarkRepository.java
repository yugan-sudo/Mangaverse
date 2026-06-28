package com.mangaverse.repository;

import com.mangaverse.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserId(Long userId);
    // FIX [HIGH]: added — was missing, causing AdminController and ZipUploadController
    // to fall back to findAll() (full table scan) and then filter in memory.
    List<Bookmark> findByComicId(Long comicId);
    boolean existsByUserIdAndComicId(Long userId, Long comicId);
    @Transactional void deleteByUserIdAndComicId(Long userId, Long comicId);
    @Transactional void deleteByComicId(Long comicId);
    long countByUserId(Long userId);
}
