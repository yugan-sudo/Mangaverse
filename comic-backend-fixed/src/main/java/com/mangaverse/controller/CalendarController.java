package com.mangaverse.controller;

import com.mangaverse.entity.Chapter;
import com.mangaverse.repository.ChapterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final ChapterRepository chapterRepo;

    public CalendarController(ChapterRepository chapterRepo) {
        this.chapterRepo = chapterRepo;
    }

    /**
     * GET /api/calendar?days=14
     * Returns upcoming scheduled chapters grouped by date.
     * Public — no auth required.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCalendar(
            @RequestParam(defaultValue = "14") int days) {

        if (days < 1 || days > 90) days = 14; // guard runaway queries

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to   = from.plusDays(days);
        List<Chapter> upcoming = chapterRepo.findScheduled(from, to);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, List<Map<String, Object>>> byDate = new LinkedHashMap<>();

        for (Chapter ch : upcoming) {
            String dateKey = ch.getScheduledAt().toLocalDate().format(dateFmt);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("chapterId",     ch.getId());
            item.put("chapterNumber", ch.getChapterNumber());
            item.put("title",         ch.getTitle() != null ? ch.getTitle() : "");
            // FIX: send full ISO-8601 string so the frontend can parse it
            // unambiguously regardless of timezone offsets.
            item.put("scheduledAt",   ch.getScheduledAt().toString());
            item.put("comicId",       ch.getComic().getId());
            item.put("comicTitle",    ch.getComic().getTitle());
            item.put("comicCover",    ch.getComic().getCoverImage() != null ? ch.getComic().getCoverImage() : "");
            item.put("comicGenre",    ch.getComic().getGenre() != null ? ch.getComic().getGenre() : "");
            byDate.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(item);
        }

        List<Map<String, Object>> result = byDate.entrySet().stream().map(e -> {
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date",     e.getKey());
            day.put("chapters", e.getValue());
            return day;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * PUT /api/admin/chapters/{id}/schedule
     * FIX 1: URL changed from /api/calendar/admin/schedule/{id} to match the
     *         /api/admin/** pattern used by every other admin endpoint in this
     *         project. The old URL was under /api/calendar/** so SecurityConfig's
     *         .requestMatchers("/api/admin/**").hasRole("ADMIN") rule never matched
     *         it — anyone could call it with no auth at all.
     * FIX 2: @PreAuthorize added as a second layer of defence.
     *
     * Body: { "scheduledAt": "2025-07-15T09:00:00" } to schedule,
     *        { "scheduledAt": null } or {} to unschedule (make it live immediately).
     */
    @PutMapping("/admin/chapters/{id}/schedule")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> scheduleChapter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Chapter ch = chapterRepo.findById(id).orElse(null);
        if (ch == null) return ResponseEntity.notFound().build();

        String scheduledAt = body.get("scheduledAt");
        if (scheduledAt != null && !scheduledAt.isBlank()) {
            try {
                ch.setScheduledAt(LocalDateTime.parse(scheduledAt));
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid scheduledAt format. Use ISO-8601: 2025-07-15T09:00:00"));
            }
        } else {
            ch.setScheduledAt(null); // null = immediately live
        }

        chapterRepo.save(ch);
        return ResponseEntity.ok(Map.of(
            "chapterId",   ch.getId(),
            "scheduledAt", ch.getScheduledAt() != null ? ch.getScheduledAt().toString() : null,
            "message",     ch.getScheduledAt() != null
                ? "Chapter scheduled for " + ch.getScheduledAt()
                : "Chapter is now live (schedule cleared)"
        ));
    }
}
