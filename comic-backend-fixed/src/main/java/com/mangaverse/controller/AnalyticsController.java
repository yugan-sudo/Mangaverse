package com.mangaverse.controller;

import com.mangaverse.repository.*;
import com.mangaverse.entity.Comic;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin/analytics")
public class AnalyticsController {

    private final ComicRepository   comicRepo;
    private final UserRepository    userRepo;
    private final ChapterRepository chapterRepo;
    private final BookmarkRepository bookmarkRepo;
    private final ComicLikeRepository likeRepo;
    private final ReadingProgressRepository progressRepo;

    public AnalyticsController(ComicRepository comicRepo, UserRepository userRepo,
                                ChapterRepository chapterRepo, BookmarkRepository bookmarkRepo,
                                ComicLikeRepository likeRepo, ReadingProgressRepository progressRepo) {
        this.comicRepo    = comicRepo;
        this.userRepo     = userRepo;
        this.chapterRepo  = chapterRepo;
        this.bookmarkRepo = bookmarkRepo;
        this.likeRepo     = likeRepo;
        this.progressRepo = progressRepo;
    }

    // GET /api/admin/analytics?days=30
    // Cached for 15 min (see CacheConfig) — analytics/retention/funnel data
    // doesn't need to be real-time and these queries scan the whole user/progress tables.
    @org.springframework.cache.annotation.Cacheable(value = "adminAnalytics", key = "#days")
    @GetMapping
    public ResponseEntity<Map<String, Object>> analytics(
            @RequestParam(defaultValue = "30") int days) {

        LocalDateTime since = LocalDateTime.now().minusDays(days);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");
        Map<String, Object> result = new LinkedHashMap<>();

        // ── Summary cards ─────────────────────────────────────────────
        result.put("totalComics",    comicRepo.count());
        result.put("totalUsers",     userRepo.count());
        result.put("totalChapters",  chapterRepo.count());
        result.put("totalBookmarks", bookmarkRepo.count());
        result.put("totalLikes",     likeRepo.count());
        result.put("newUsers",       userRepo.countByCreatedAtAfter(since));

        // ── New registrations by day ──────────────────────────────────
        List<Map<String, Object>> regByDay = new ArrayList<>();
        for (Object[] row : userRepo.registrationsByDay(since)) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date",  row[0] != null ? row[0].toString() : "");
            pt.put("count", row[1]);
            regByDay.add(pt);
        }
        result.put("registrationsByDay", regByDay);

        // ── Chapter uploads by day ────────────────────────────────────
        List<Map<String, Object>> chapByDay = new ArrayList<>();
        for (Object[] row : chapterRepo.uploadsByDay(since)) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date",  row[0] != null ? row[0].toString() : "");
            pt.put("count", row[1]);
            chapByDay.add(pt);
        }
        result.put("chaptersByDay", chapByDay);

        // ── Comics by genre — split comma-separated genres ────────────
        Map<String, Long> genreMap = new java.util.TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (Comic c : comicRepo.findAll()) {
            if (c.getGenre() == null || c.getGenre().isBlank()) continue;
            for (String g : c.getGenre().split("[,，\\s]+")) {
                String trimmed = g.trim();
                if (!trimmed.isEmpty()) {
                    genreMap.merge(
                        Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1).toLowerCase(),
                        1L, Long::sum
                    );
                }
            }
        }
        List<Map<String, Object>> byGenre = genreMap.entrySet().stream()
            .sorted(java.util.Map.Entry.<String, Long>comparingByValue().reversed())
            .map(e -> {
                Map<String, Object> pt = new LinkedHashMap<>();
                pt.put("genre", e.getKey());
                pt.put("count", e.getValue());
                return pt;
            })
            .collect(java.util.stream.Collectors.toList());
        result.put("comicsByGenre", byGenre);

        // ── Comics added by day ───────────────────────────────────────
        List<Map<String, Object>> comicsByDay = new ArrayList<>();
        for (Object[] row : comicRepo.countByDay(since)) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date",  row[0] != null ? row[0].toString() : "");
            pt.put("count", row[1]);
            comicsByDay.add(pt);
        }
        result.put("comicsByDay", comicsByDay);

        // ── Most-read chapters (chapter analytics) ────────────────────
        List<Map<String, Object>> topChapters = new ArrayList<>();
        for (Object[] row : chapterRepo.mostReadChapters(org.springframework.data.domain.PageRequest.of(0, 10))) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("chapterId",   row[0]);
            pt.put("chapterNum",  row[1]);
            pt.put("comicTitle",  row[2]);
            pt.put("reads",       row[3]);
            topChapters.add(pt);
        }
        result.put("mostReadChapters", topChapters);

        // ── User retention (Day 1 / Day 7) ─────────────────────────────
        // For each user registered before the relevant window, check whether
        // they had any reading activity 1 / 7 days after registration.
        Map<Long, LocalDateTime> lastActivity = new HashMap<>();
        for (Object[] row : progressRepo.lastActivityByUser()) {
            lastActivity.put((Long) row[0], (LocalDateTime) row[1]);
        }

        long d1Eligible = 0, d1Retained = 0;
        long d7Eligible = 0, d7Retained = 0;
        LocalDateTime now = LocalDateTime.now();
        for (var user : userRepo.findAll()) {
            LocalDateTime createdAt = user.getCreatedAt();
            if (createdAt == null) continue;

            LocalDateTime activity = lastActivity.get(user.getId());

            // Day 1 retention: user account is at least 1 day old
            if (now.isAfter(createdAt.plusDays(1))) {
                d1Eligible++;
                if (activity != null && activity.isAfter(createdAt.plusHours(12)) &&
                    activity.isBefore(createdAt.plusDays(2))) {
                    d1Retained++;
                }
            }
            // Day 7 retention: user account is at least 7 days old
            if (now.isAfter(createdAt.plusDays(7))) {
                d7Eligible++;
                if (activity != null && activity.isAfter(createdAt.plusDays(6)) &&
                    activity.isBefore(createdAt.plusDays(8))) {
                    d7Retained++;
                }
            }
        }
        Map<String, Object> retention = new LinkedHashMap<>();
        retention.put("day1Rate", d1Eligible > 0 ? Math.round((d1Retained * 1000.0) / d1Eligible) / 10.0 : 0);
        retention.put("day7Rate", d7Eligible > 0 ? Math.round((d7Retained * 1000.0) / d7Eligible) / 10.0 : 0);
        retention.put("day1Eligible", d1Eligible);
        retention.put("day7Eligible", d7Eligible);
        result.put("retention", retention);

        // ── Funnel metrics ──────────────────────────────────────────────
        long totalUsers      = userRepo.count();
        long usersWithBookmarks = bookmarkRepo.findAll().stream()
                .map(b -> b.getUser().getId()).distinct().count();

        long usersWith10Plus = 0;
        for (Object[] row : progressRepo.totalChaptersReadByUser()) {
            Long sum = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            if (sum >= 10) usersWith10Plus++;
        }

        List<Map<String, Object>> funnel = new ArrayList<>();
        funnel.add(Map.of("stage", "Registrations", "count", totalUsers));
        funnel.add(Map.of("stage", "Bookmarked a comic", "count", usersWithBookmarks));
        funnel.add(Map.of("stage", "Read 10+ chapters", "count", usersWith10Plus));
        result.put("funnel", funnel);

        return ResponseEntity.ok(result);
    }
}
