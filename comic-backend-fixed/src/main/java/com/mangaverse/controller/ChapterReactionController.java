package com.mangaverse.controller;

import com.mangaverse.entity.ChapterReaction;
import com.mangaverse.repository.ChapterReactionRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chapters/{chapterId}/reactions")
public class ChapterReactionController {

    private final ChapterReactionRepository reactionRepo;
    private final UserRepository userRepo;
    private static final List<String> VALID = List.of("UPVOTE","FUNNY","LOVE","SURPRISED","ANGRY","SAD");

    public ChapterReactionController(ChapterReactionRepository reactionRepo, UserRepository userRepo) {
        this.reactionRepo = reactionRepo; this.userRepo = userRepo;
    }

    @GetMapping
    public ResponseEntity<?> getReactions(@PathVariable Long chapterId,
            @AuthenticationPrincipal UserDetails principal) {
        Map<String, Long> counts = new LinkedHashMap<>();
        VALID.forEach(r -> counts.put(r, 0L));
        for (Object[] row : reactionRepo.countByChapterId(chapterId))
            counts.put(row[0].toString(), (Long) row[1]);

        List<String> myReactions = new ArrayList<>();
        if (principal != null) {
            userRepo.findByUsername(principal.getUsername()).ifPresent(u ->
                reactionRepo.findByUserIdAndChapterId(u.getId(), chapterId)
                    .forEach(r -> myReactions.add(r.getReactionType()))
            );
        }
        return ResponseEntity.ok(Map.of("counts", counts, "myReactions", myReactions,
            "total", counts.values().stream().mapToLong(Long::longValue).sum()));
    }

    @PostMapping("/{type}")
    public ResponseEntity<?> toggleReaction(@PathVariable Long chapterId, @PathVariable String type,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        if (!VALID.contains(type.toUpperCase())) return ResponseEntity.badRequest().body(Map.of("error","Invalid reaction"));
        var user = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        var existing = reactionRepo.findByUserIdAndChapterIdAndReactionType(user.getId(), chapterId, type.toUpperCase());
        if (existing.isPresent()) {
            reactionRepo.delete(existing.get());
            return ResponseEntity.ok(Map.of("toggled", false));
        }
        ChapterReaction r = new ChapterReaction();
        r.setUser(user); r.setChapterId(chapterId); r.setReactionType(type.toUpperCase());
        reactionRepo.save(r);
        return ResponseEntity.ok(Map.of("toggled", true));
    }
}
