package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserRepository            userRepo;
    private final UserFollowRepository      followRepo;
    private final UserBadgeRepository       badgeRepo;
    private final BookmarkRepository        bookmarkRepo;
    private final ReadingProgressRepository progressRepo;
    private final ReadingStreakRepository   streakRepo;

    public UserProfileController(UserRepository userRepo, UserFollowRepository followRepo,
                                  UserBadgeRepository badgeRepo, BookmarkRepository bookmarkRepo,
                                  ReadingProgressRepository progressRepo, ReadingStreakRepository streakRepo) {
        this.userRepo     = userRepo;   this.followRepo  = followRepo;
        this.badgeRepo    = badgeRepo;  this.bookmarkRepo = bookmarkRepo;
        this.progressRepo = progressRepo; this.streakRepo = streakRepo;
    }

    // GET /api/users/{username} — public profile
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username,
            @AuthenticationPrincipal UserDetails principal) {
        User target = userRepo.findByUsername(username).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();

        boolean isFollowing = false;
        if (principal != null) {
            User me = userRepo.findByUsername(principal.getUsername()).orElse(null);
            if (me != null) isFollowing = followRepo.existsByFollowerIdAndFollowingId(me.getId(), target.getId());
        }

        var streak   = streakRepo.findByUserId(target.getId()).orElse(new ReadingStreak());
        var badges   = badgeRepo.findByUserId(target.getId());
        var progress = progressRepo.findByUserIdOrderByUpdatedAtDesc(target.getId());

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id",             target.getId());
        profile.put("username",       target.getUsername());
        // FIX: include avatar, displayName, and bio so UserProfile.jsx can render
        // the user's actual avatar image/emoji and display name instead of just
        // the username letter fallback.
        profile.put("avatar",         target.getAvatar()      != null ? target.getAvatar()      : "");
        profile.put("displayName",    target.getDisplayName() != null ? target.getDisplayName() : target.getUsername());
        profile.put("bio",            target.getBio()         != null ? target.getBio()         : "");
        profile.put("joinedAt",       target.getCreatedAt());
        profile.put("followers",      followRepo.countByFollowingId(target.getId()));
        profile.put("following",      followRepo.countByFollowerId(target.getId()));
        profile.put("isFollowing",    isFollowing);
        profile.put("bookmarkCount",  bookmarkRepo.countByUserId(target.getId()));
        profile.put("chaptersRead",   progress.stream().mapToInt(ReadingProgress::getChaptersRead).sum());
        profile.put("currentStreak",  streak.getCurrentStreak());
        profile.put("longestStreak",  streak.getLongestStreak());
        profile.put("badges",         badges.stream().map(b -> Map.of(
                "key",      b.getBadgeKey(),
                "earnedAt", b.getEarnedAt()
        )).toList());
        profile.put("recentActivity", progress.stream().limit(6).map(p -> Map.of(
                "comicId",    p.getComic().getId(),
                "comicTitle", p.getComic().getTitle(),
                "comicCover", p.getComic().getCoverImage() != null ? p.getComic().getCoverImage() : "",
                "lastChapter",p.getLastChapterNumber(),
                "updatedAt",  p.getUpdatedAt()
        )).toList());
        return ResponseEntity.ok(profile);
    }

    // POST /api/users/{username}/follow — toggle follow
    @PostMapping("/{username}/follow")
    public ResponseEntity<?> toggleFollow(@PathVariable String username,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User me     = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        User target = userRepo.findByUsername(username).orElse(null);
        if (target == null || target.getId().equals(me.getId()))
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid"));

        var existing = followRepo.findByFollowerIdAndFollowingId(me.getId(), target.getId());
        if (existing.isPresent()) {
            followRepo.delete(existing.get());
            return ResponseEntity.ok(Map.of("following", false, "followers", followRepo.countByFollowingId(target.getId())));
        } else {
            UserFollow f = new UserFollow();
            f.setFollower(me); f.setFollowing(target);
            followRepo.save(f);
            return ResponseEntity.ok(Map.of("following", true, "followers", followRepo.countByFollowingId(target.getId())));
        }
    }

    // GET /api/users/{username}/badges
    @GetMapping("/{username}/badges")
    public ResponseEntity<?> getBadges(@PathVariable String username) {
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(badgeRepo.findByUserId(user.getId()).stream().map(b -> Map.of(
            "key", b.getBadgeKey(), "earnedAt", b.getEarnedAt()
        )).toList());
    }

    // GET /api/users/me/following-feed
    @GetMapping("/me/following-feed")
    public ResponseEntity<?> followingFeed(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User me = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        var following = followRepo.findByFollowerId(me.getId())
                .stream().map(f -> f.getFollowing().getId()).toList();
        if (following.isEmpty()) return ResponseEntity.ok(List.of());

        var feed = new ArrayList<Map<String, Object>>();
        for (Long uid : following) {
            userRepo.findById(uid).ifPresent(u -> {
                progressRepo.findByUserIdOrderByUpdatedAtDesc(uid).stream().limit(3).forEach(p -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("username",    u.getUsername());
                    item.put("comicId",     p.getComic().getId());
                    item.put("comicTitle",  p.getComic().getTitle());
                    item.put("comicCover",  p.getComic().getCoverImage() != null ? p.getComic().getCoverImage() : "");
                    item.put("lastChapter", p.getLastChapterNumber());
                    item.put("updatedAt",   p.getUpdatedAt());
                    feed.add(item);
                });
            });
        }
        feed.sort(Comparator.comparing(m -> m.get("updatedAt").toString(), Comparator.reverseOrder()));
        return ResponseEntity.ok(feed.subList(0, Math.min(feed.size(), 20)));
    }
}
