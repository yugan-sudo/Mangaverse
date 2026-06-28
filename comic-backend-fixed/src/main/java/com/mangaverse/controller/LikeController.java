package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/comics/{comicId}/likes")
public class LikeController {

    private final ComicLikeRepository likeRepo;
    private final ComicRepository     comicRepo;
    private final UserRepository      userRepo;

    public LikeController(ComicLikeRepository likeRepo, ComicRepository comicRepo,
                          UserRepository userRepo) {
        this.likeRepo  = likeRepo;
        this.comicRepo = comicRepo;
        this.userRepo  = userRepo;
    }

    // GET — returns like count + whether the logged-in user liked it
    @GetMapping
    public ResponseEntity<Map<String, Object>> getLikes(
            @PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {

        long    count = likeRepo.countByComicId(comicId);
        boolean liked = false;

        if (principal != null) {
            User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
            if (user != null) liked = likeRepo.existsByUserIdAndComicId(user.getId(), comicId);
        }
        return ResponseEntity.ok(Map.of("count", count, "liked", liked));
    }

    // POST — toggle like on/off
    // @Transactional here ensures deleteByUserIdAndComicId runs inside a transaction
    @PostMapping
    @Transactional
    public ResponseEntity<?> toggleLike(
            @PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal) {

        // principal is null if token is missing/invalid — return 401 message
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Please login to like."));
        }

        User user = userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comic comic = comicRepo.findById(comicId)
                .orElseThrow(() -> new RuntimeException("Comic not found"));

        if (likeRepo.existsByUserIdAndComicId(user.getId(), comicId)) {
            // Already liked → remove like
            likeRepo.deleteByUserIdAndComicId(user.getId(), comicId);
            return ResponseEntity.ok(Map.of(
                "liked", false,
                "count", likeRepo.countByComicId(comicId)
            ));
        } else {
            // Not liked yet → add like
            likeRepo.save(ComicLike.builder().user(user).comic(comic).build());
            return ResponseEntity.ok(Map.of(
                "liked", true,
                "count", likeRepo.countByComicId(comicId)
            ));
        }
    }
}
