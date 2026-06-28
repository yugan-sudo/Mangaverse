package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.*;

@RestController
@RequestMapping("/api/comics/{comicId}")
public class ReviewController {

    private final ReviewRepository reviewRepo;
    private final ComicRepository  comicRepo;
    private final UserRepository   userRepo;

    public ReviewController(ReviewRepository reviewRepo, ComicRepository comicRepo,
                            UserRepository userRepo) {
        this.reviewRepo = reviewRepo; this.comicRepo = comicRepo; this.userRepo = userRepo;
    }

    // ── GET reviews ─────────────────────────────────────────────────────
    @GetMapping("/reviews")
    public ResponseEntity<?> getReviews(@PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {
        List<Map<String, Object>> reviews = reviewRepo
            .findByComicIdOrderByHelpfulCountDescCreatedAtDesc(comicId)
            .stream().map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           r.getId());
                m.put("stars",        r.getStars());
                m.put("body",         r.getBody());
                m.put("helpfulCount", r.getHelpfulCount());
                m.put("createdAt",    r.getCreatedAt());
                m.put("username",     r.getUser().getUsername());
                return m;
            }).collect(Collectors.toList());

        Double avg   = reviewRepo.averageByComicId(comicId);
        long   count = reviewRepo.countByComicId(comicId);

        int myStars = 0;
        if (principal != null) {
            User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
            if (user != null) {
                myStars = reviewRepo.findByUserIdAndComicId(user.getId(), comicId)
                    .map(Review::getStars).orElse(0);
            }
        }

        return ResponseEntity.ok(Map.of(
            "reviews",   reviews,
            "average",   avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "count",     count,
            "myStars",   myStars
        ));
    }

    // ── POST / PUT review ────────────────────────────────────────────────
    @PostMapping("/reviews")
    public ResponseEntity<?> upsertReview(@PathVariable Long comicId,
            @RequestBody ReviewRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User  user  = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        Comic comic = comicRepo.findById(comicId).orElse(null);
        if (comic == null) return ResponseEntity.notFound().build();
        if (req.getStars() < 1 || req.getStars() > 5)
            return ResponseEntity.badRequest().body(Map.of("error", "Stars must be 1-5"));

        Review review = reviewRepo.findByUserIdAndComicId(user.getId(), comicId)
            .orElseGet(() -> { Review r = new Review(); r.setUser(user); r.setComic(comic); return r; });
        review.setStars(req.getStars());
        review.setBody(req.getBody() != null ? req.getBody().trim() : null);
        reviewRepo.save(review);
        return ResponseEntity.ok(Map.of("message", "Review saved", "stars", review.getStars()));
    }

    // ── DELETE review ────────────────────────────────────────────────────
    @DeleteMapping("/reviews")
    public ResponseEntity<?> deleteReview(@PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        reviewRepo.findByUserIdAndComicId(user.getId(), comicId).ifPresent(reviewRepo::delete);
        return ResponseEntity.ok(Map.of("message", "Review deleted"));
    }

    // ── POST helpful ─────────────────────────────────────────────────────
    @PostMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<?> markHelpful(@PathVariable Long comicId, @PathVariable Long reviewId) {
        Review r = reviewRepo.findById(reviewId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        r.setHelpfulCount(r.getHelpfulCount() + 1);
        reviewRepo.save(r);
        return ResponseEntity.ok(Map.of("helpfulCount", r.getHelpfulCount()));
    }

    // ── GET related comics (same genre/author, not this comic) ───────────
    @GetMapping("/related")
    public ResponseEntity<?> getRelated(@PathVariable Long comicId,
            @RequestParam(defaultValue = "8") int limit) {
        Comic base = comicRepo.findById(comicId).orElse(null);
        if (base == null) return ResponseEntity.notFound().build();

        String genre  = base.getGenre() != null ? base.getGenre().split(",")[0].trim() : null;
        String author = base.getAuthor();

        List<Comic> all = comicRepo.findAll();
        List<Map<String, Object>> related = all.stream()
            .filter(c -> !c.getId().equals(comicId))
            .map(c -> {
                int score = 0;
                if (author != null && author.equalsIgnoreCase(c.getAuthor())) score += 5;
                if (genre  != null && c.getGenre() != null && c.getGenre().toLowerCase().contains(genre.toLowerCase())) score += 3;
                if (base.getTags() != null && c.getTags() != null) {
                    for (String t : base.getTags().split(",")) {
                        if (c.getTags().toLowerCase().contains(t.trim().toLowerCase())) score++;
                    }
                }
                return Map.of("comic", c, "score", score);
            })
            .filter(m -> (int) m.get("score") > 0)
            .sorted(Comparator.comparingInt(m -> -((int) m.get("score"))))
            .limit(limit)
            .map(m -> {
                Comic c = (Comic) m.get("comic");
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("id",          c.getId());
                r.put("title",       c.getTitle());
                r.put("coverImage",  c.getCoverImage());
                r.put("genre",       c.getGenre());
                r.put("status",      c.getStatus() != null ? c.getStatus().name() : "ONGOING");
                return r;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(related);
    }

    public static class ReviewRequest {
        private int stars; private String body;
        public int    getStars() { return stars; } public void setStars(int s)    { this.stars=s; }
        public String getBody()  { return body;  } public void setBody(String b)  { this.body=b; }
    }
}
