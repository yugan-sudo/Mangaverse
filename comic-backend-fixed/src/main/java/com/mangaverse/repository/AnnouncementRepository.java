package com.mangaverse.repository;

import com.mangaverse.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Public: active announcements — pinned first, then newest
    // Live = active AND (publishAt IS NULL OR publishAt <= NOW)
    @Query("SELECT a FROM Announcement a WHERE a.active = true AND (a.publishAt IS NULL OR a.publishAt <= CURRENT_TIMESTAMP) ORDER BY a.pinned DESC, a.createdAt DESC")
    List<Announcement> findActiveOrderByPinnedDesc();

    // All (including scheduled) for admin view
    @Query("SELECT a FROM Announcement a ORDER BY a.createdAt DESC")
    List<Announcement> findAllForAdmin();

    // Public: latest N active announcements for sidebar widget
    @Query("SELECT a FROM Announcement a WHERE a.active = true AND (a.publishAt IS NULL OR a.publishAt <= CURRENT_TIMESTAMP) ORDER BY a.pinned DESC, a.createdAt DESC LIMIT :limit")
    List<Announcement> findTopActive(int limit);
}
