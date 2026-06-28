package com.mangaverse.controller;

import com.mangaverse.entity.Comic;
import com.mangaverse.repository.BookmarkRepository;
import com.mangaverse.repository.ComicRepository;
import com.mangaverse.repository.ReadingProgressRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final ComicRepository           comicRepo;
    private final BookmarkRepository        bookmarkRepo;
    private final ReadingProgressRepository progressRepo;
    private final UserRepository            userRepo;

    public RecommendationController(ComicRepository comicRepo, BookmarkRepository bookmarkRepo,
                                    ReadingProgressRepository progressRepo, UserRepository userRepo) {
        this.comicRepo    = comicRepo;    this.bookmarkRepo = bookmarkRepo;
        this.progressRepo = progressRepo; this.userRepo     = userRepo;
    }

    /**
     * GET /api/recommendations?limit=8
     * Returns personalised recommendations based on:
     *  1. User bookmarks → extract genres → find similar comics not yet bookmarked
     *  2. Reading progress → extract genres → boost matching
     *  Falls back to top-rated comics for anonymous users.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam(defaultValue = "8") int limit,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null) {
            // Anonymous — return popular comics
            List<Comic> popular = comicRepo.findAll(PageRequest.of(0, limit)).getContent();
            return ResponseEntity.ok(Map.of(
                "reason",  "Popular this week",
                "comics",  toList(popular)
            ));
        }

        var user = userRepo.findByUsername(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.ok(Map.of("reason", "Popular", "comics", List.of()));

        // Get bookmarked comic IDs and their genres
        var bookmarked  = bookmarkRepo.findByUserId(user.getId());
        var readProgress = progressRepo.findByUserIdOrderByUpdatedAtDesc(user.getId());

        if (bookmarked.isEmpty() && readProgress.isEmpty()) {
            List<Comic> popular = comicRepo.findAll(PageRequest.of(0, limit)).getContent();
            return ResponseEntity.ok(Map.of("reason", "Popular picks for you", "comics", toList(popular)));
        }

        // Collect bookmarked comic IDs to exclude
        Set<Long> excludeIds = new HashSet<>();
        Map<String, Integer> genreScore = new LinkedHashMap<>();

        bookmarked.forEach(b -> {
            excludeIds.add(b.getComic().getId());
            scoreGenres(b.getComic().getGenre(), genreScore, 2);
            scoreGenres(b.getComic().getTags(),  genreScore, 1);
        });
        readProgress.stream().limit(10).forEach(p -> {
            excludeIds.add(p.getComic().getId());
            scoreGenres(p.getComic().getGenre(), genreScore, 1);
        });

        if (genreScore.isEmpty()) {
            List<Comic> popular = comicRepo.findAll(PageRequest.of(0, limit)).getContent();
            return ResponseEntity.ok(Map.of("reason", "Top picks", "comics", toList(popular)));
        }

        // Top genre to use as reason label
        String topGenre = genreScore.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("Action");

        // Source comic title for "Because you read X"
        String sourceName = bookmarked.isEmpty()
            ? readProgress.get(0).getComic().getTitle()
            : bookmarked.get(bookmarked.size() - 1).getComic().getTitle();

        // Find all comics, score them, exclude already bookmarked
        List<Comic> all = comicRepo.findAll();
        List<Map<String, Object>> scored = all.stream()
            .filter(c -> !excludeIds.contains(c.getId()))
            .map(c -> {
                int score = 0;
                for (var e : genreScore.entrySet()) {
                    if (matches(c.getGenre(), e.getKey())) score += e.getValue() * 3;
                    if (matches(c.getTags(),  e.getKey())) score += e.getValue();
                }
                return Map.of("comic", c, "score", score);
            })
            .filter(m -> (int) m.get("score") > 0)
            .sorted(Comparator.comparingInt(m -> -((int) m.get("score"))))
            .limit(limit)
            .map(m -> toMap((Comic) m.get("comic")))
            .collect(Collectors.toList());

        if (scored.isEmpty()) {
            List<Comic> popular = comicRepo.findAll(PageRequest.of(0, limit)).getContent();
            return ResponseEntity.ok(Map.of("reason", "You might also like", "comics", toList(popular)));
        }

        return ResponseEntity.ok(Map.of(
            "reason", "Because you read " + sourceName,
            "comics", scored
        ));
    }

    private void scoreGenres(String genreStr, Map<String, Integer> scores, int weight) {
        if (genreStr == null || genreStr.isBlank()) return;
        for (String g : genreStr.split("[,，\\s]+")) {
            String t = g.trim().toLowerCase();
            if (!t.isEmpty()) scores.merge(t, weight, Integer::sum);
        }
    }

    private boolean matches(String field, String term) {
        return field != null && field.toLowerCase().contains(term.toLowerCase());
    }

    private List<Map<String, Object>> toList(List<Comic> comics) {
        return comics.stream().map(this::toMap).collect(Collectors.toList());
    }

    private Map<String, Object> toMap(Comic c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          c.getId());
        m.put("title",       c.getTitle());
        m.put("author",      c.getAuthor());
        m.put("genre",       c.getGenre());
        m.put("tags",        c.getTags());
        m.put("coverImage",  c.getCoverImage());
        m.put("status",      c.getStatus() != null ? c.getStatus().name() : "ONGOING");
        return m;
    }
}
