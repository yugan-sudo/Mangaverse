package com.mangaverse.controller;

import com.mangaverse.entity.AuthorFollow;
import com.mangaverse.entity.User;
import com.mangaverse.repository.AuthorFollowRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/authors")
public class AuthorFollowController {

    private final AuthorFollowRepository followRepo;
    private final UserRepository         userRepo;

    public AuthorFollowController(AuthorFollowRepository followRepo, UserRepository userRepo) {
        this.followRepo = followRepo;
        this.userRepo   = userRepo;
    }

    // GET — list all authors the logged-in user follows
    @GetMapping("/following")
    public ResponseEntity<List<AuthorFollow>> getFollowing(
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        return ResponseEntity.ok(followRepo.findByUserId(user.getId()));
    }

    // GET — check if user follows a specific author
    @GetMapping("/{authorName}/following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(
            @PathVariable String authorName,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null)
            return ResponseEntity.ok(Map.of("following", false));
        User user = resolve(principal);
        boolean following = followRepo.existsByUserIdAndAuthorName(user.getId(), authorName);
        return ResponseEntity.ok(Map.of("following", following));
    }

    // POST — toggle follow/unfollow an author
    @PostMapping("/{authorName}/follow")
    @Transactional
    public ResponseEntity<?> toggleFollow(
            @PathVariable String authorName,
            @AuthenticationPrincipal UserDetails principal) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("message", "Please login to follow authors."));

        User user = resolve(principal);

        if (followRepo.existsByUserIdAndAuthorName(user.getId(), authorName)) {
            // Already following → unfollow
            followRepo.deleteByUserIdAndAuthorName(user.getId(), authorName);
            return ResponseEntity.ok(Map.of("following", false, "message", "Unfollowed " + authorName));
        } else {
            // Not following → follow
            followRepo.save(AuthorFollow.builder().user(user).authorName(authorName).build());
            return ResponseEntity.ok(Map.of("following", true, "message", "Now following " + authorName));
        }
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
