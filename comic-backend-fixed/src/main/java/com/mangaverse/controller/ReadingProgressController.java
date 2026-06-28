package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/progress")
public class ReadingProgressController {

    private final ReadingProgressRepository progressRepo;
    private final UserRepository            userRepo;
    private final ComicRepository           comicRepo;
    private final ChapterRepository         chapterRepo;
    private final ReadingStreakRepository   streakRepo;
    private final UserBadgeRepository       badgeRepo;

    public ReadingProgressController(ReadingProgressRepository progressRepo, UserRepository userRepo,
                                     ComicRepository comicRepo, ChapterRepository chapterRepo,
                                     ReadingStreakRepository streakRepo, UserBadgeRepository badgeRepo) {
        this.progressRepo = progressRepo; this.userRepo   = userRepo;
        this.comicRepo    = comicRepo;    this.chapterRepo = chapterRepo;
        this.streakRepo   = streakRepo;   this.badgeRepo  = badgeRepo;
    }

    @GetMapping("/{comicId}")
    public ResponseEntity<?> getProgress(@PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        if (user == null) return ResponseEntity.ok(Map.of("chaptersRead", 0));
        var progress = progressRepo.findByUserIdAndComicId(user.getId(), comicId);
        return ResponseEntity.ok(progress.map(p -> Map.of(
            "chaptersRead",      p.getChaptersRead(),
            "lastChapterId",     p.getLastChapterId(),
            "lastChapterNumber", p.getLastChapterNumber(),
            "updatedAt",         p.getUpdatedAt()
        )).orElse(Map.of("chaptersRead", 0)));
    }

    @PostMapping("/{comicId}/chapter/{chapterId}")
    @Transactional  // FIX [Bug 1]: wrap entire mark-read + badge award in one transaction
    public ResponseEntity<?> markRead(@PathVariable Long comicId, @PathVariable Long chapterId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        if (user == null) return ResponseEntity.status(401).build();

        Comic   comic   = comicRepo.findById(comicId).orElse(null);
        Chapter chapter = chapterRepo.findById(chapterId).orElse(null);
        if (comic == null || chapter == null) return ResponseEntity.notFound().build();

        ReadingProgress prog;
        try {
            prog = progressRepo.findByUserIdAndComicId(user.getId(), comicId)
                    .orElseGet(() -> { var p = new ReadingProgress(); p.setUser(user); p.setComic(comic); return p; });
            prog.setLastChapterId(chapterId);
            prog.setLastChapterNumber(chapter.getChapterNumber());
            prog.setChaptersRead(prog.getChaptersRead() + 1);
            progressRepo.save(prog);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            prog = progressRepo.findByUserIdAndComicId(user.getId(), comicId)
                    .orElseThrow(() -> e);
            prog.setLastChapterId(chapterId);
            prog.setLastChapterNumber(chapter.getChapterNumber());
            prog.setChaptersRead(prog.getChaptersRead() + 1);
            progressRepo.save(prog);
        }

        List<String> newBadges = new ArrayList<>();
        updateStreak(user.getId(), newBadges);
        awardBadges(user, prog.getChaptersRead(), newBadges);

        return ResponseEntity.ok(Map.of(
            "chaptersRead", prog.getChaptersRead(),
            "newBadges",    newBadges
        ));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllProgress(@AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        if (user == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(progressRepo.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("comicId",           p.getComic().getId());
            m.put("comicTitle",        p.getComic().getTitle());
            m.put("comicCover",        p.getComic().getCoverImage());
            m.put("chaptersRead",      p.getChaptersRead());
            m.put("totalChapters",     p.getComic().getTotalChapters());
            m.put("lastChapterId",     p.getLastChapterId());
            m.put("lastChapterNumber", p.getLastChapterNumber());
            m.put("updatedAt",         p.getUpdatedAt());
            return m;
        }).toList());
    }

    @GetMapping("/streak")
    public ResponseEntity<?> getStreak(@AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        if (user == null) return ResponseEntity.ok(Map.of("current", 0, "longest", 0));
        var streak = streakRepo.findByUserId(user.getId()).orElse(new ReadingStreak());
        return ResponseEntity.ok(Map.of(
            "current",      streak.getCurrentStreak(),
            "longest",      streak.getLongestStreak(),
            "lastReadDate", streak.getLastReadDate() != null ? streak.getLastReadDate().toString() : null
        ));
    }

    // ─── helpers ──────────────────────────────────────────────────────────

    private void updateStreak(Long userId, List<String> newBadges) {
        ReadingStreak streak = streakRepo.findByUserId(userId).orElseGet(() -> {
            ReadingStreak s = new ReadingStreak(); s.setUserId(userId); return s;
        });
        LocalDate today = LocalDate.now();
        if (streak.getLastReadDate() == null || streak.getLastReadDate().isBefore(today.minusDays(1))) {
            streak.setCurrentStreak(1);
        } else if (streak.getLastReadDate().isBefore(today)) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        }
        if (streak.getCurrentStreak() > streak.getLongestStreak())
            streak.setLongestStreak(streak.getCurrentStreak());
        streak.setLastReadDate(today);
        streakRepo.save(streak);
        awardBadge(userId, "STREAK_7",  "🔥 7-Day Streak",  streak.getCurrentStreak() >= 7,  newBadges);
        awardBadge(userId, "STREAK_30", "🔥 30-Day Streak", streak.getCurrentStreak() >= 30, newBadges);
    }

    private void awardBadges(User user, int chaptersRead, List<String> newBadges) {
        awardBadge(user.getId(), "FIRST_CHAPTER", "📖 First Chapter",     chaptersRead >= 1,   newBadges);
        awardBadge(user.getId(), "READ_10",        "📗 Read 10 Chapters",  chaptersRead >= 10,  newBadges);
        awardBadge(user.getId(), "READ_50",        "📘 Read 50 Chapters",  chaptersRead >= 50,  newBadges);
        awardBadge(user.getId(), "READ_100",       "📙 Read 100 Chapters", chaptersRead >= 100, newBadges);
        awardBadge(user.getId(), "READ_500",       "🏆 Read 500 Chapters", chaptersRead >= 500, newBadges);
        int hour = java.time.LocalDateTime.now().getHour();
        awardBadge(user.getId(), "NIGHT_OWL", "🦉 Night Owl", hour >= 23 || hour <= 4, newBadges);
    }

    /**
     * FIX [Bug 1]: duplicate badge inserts on concurrent requests.
     *
     * The previous code did:
     *   if (!exists) { save() }          ← not atomic
     *
     * Two threads both pass the exists() check before either commits, then both
     * try to INSERT — MySQL fires "Duplicate entry '1-NIGHT_OWL'" on the second.
     *
     * Fix: keep the exists() guard as a fast-path (avoids the exception in normal
     * single-threaded use), then catch DataIntegrityViolationException from the
     * unique constraint and treat it as a no-op. The badge was already saved by
     * the winning thread — silently continue.
     */
    private void awardBadge(Long userId, String key, String label,
                             boolean condition, List<String> awarded) {
        if (!condition) return;
        if (badgeRepo.existsByUserIdAndBadgeKey(userId, key)) return; // fast path
        try {
            UserBadge b = new UserBadge();
            b.setUser(userRepo.getReferenceById(userId));
            b.setBadgeKey(key);
            badgeRepo.save(b);
            awarded.add(label);
        } catch (org.springframework.dao.DataIntegrityViolationException ignored) {
            // Another concurrent request already inserted this badge — that's fine.
            // The unique constraint (user_id, badge_key) guarantees exactly one row.
        }
    }

    private User resolve(UserDetails principal) {
        if (principal == null) return null;
        return userRepo.findByUsername(principal.getUsername()).orElse(null);
    }
}
