package com.mangaverse.repository;

import com.mangaverse.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    // Public: active banners within date window, by placement
    @Query("""
        SELECT b FROM Banner b
        WHERE b.active = true
          AND b.placement = :placement
          AND (b.startsAt IS NULL OR b.startsAt <= CURRENT_TIMESTAMP)
          AND (b.endsAt   IS NULL OR b.endsAt   >= CURRENT_TIMESTAMP)
        ORDER BY b.sortOrder ASC
    """)
    List<Banner> findLiveByPlacement(String placement);

    // Admin: all banners
    List<Banner> findAllByOrderBySortOrderAsc();
}
