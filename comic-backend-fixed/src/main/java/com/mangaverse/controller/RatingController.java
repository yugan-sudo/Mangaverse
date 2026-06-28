package com.mangaverse.controller;

import com.mangaverse.entity.Comic;
import com.mangaverse.entity.Rating;
import com.mangaverse.entity.User;
import com.mangaverse.repository.ComicRepository;
import com.mangaverse.repository.RatingRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/comics/{comicId}/rating")
public class RatingController {

    private final RatingRepository ratingRepo;
    private final ComicRepository  comicRepo;
    private final UserRepository   userRepo;

    public RatingController(RatingRepository ratingRepo, ComicRepository comicRepo,
                            UserRepository userRepo) {
        this.ratingRepo = ratingRepo;
        this.comicRepo  = comicRepo;
        this.userRepo   = userRepo;
    }

    // GET rating stats + this user's rating
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRating(
            @PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {

        Double avg   = ratingRepo.findAverageByComicId(comicId);
        long   count = ratingRepo.countByComicId(comicId);
        int    userRating = 0;

        // If user is logged in, include their own rating
        if (principal != null) {
            User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
            if (user != null) {
                userRating = ratingRepo
                    .findByUserIdAndComicId(user.getId(), comicId)
                    .map(Rating::getStars)
                    .orElse(0);
            }
        }

        return ResponseEntity.ok(Map.of(
            "average",    avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "count",      count,
            "userRating", userRating
        ));
    }

    // POST — submit or update rating
    @PostMapping
    public ResponseEntity<Map<String, Object>> rate(
            @PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Integer> body) {

        int stars = body.getOrDefault("stars", 0);

        // Validate stars range
        if (stars < 1 || stars > 5)
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Stars must be between 1 and 5."));

        User  user  = userRepo.findByUsername(principal.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"));
        Comic comic = comicRepo.findById(comicId)
                        .orElseThrow(() -> new RuntimeException("Comic not found"));

        // Update existing rating or create new one
        Rating rating = ratingRepo.findByUserIdAndComicId(user.getId(), comicId)
                .orElse(Rating.builder().user(user).comic(comic).build());
        rating.setStars(stars);
        ratingRepo.save(rating);

        // Return updated stats
        Double avg   = ratingRepo.findAverageByComicId(comicId);
        long   count = ratingRepo.countByComicId(comicId);

        return ResponseEntity.ok(Map.of(
            "average",    avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "count",      count,
            "userRating", stars
        ));
    }
}
