package com.mangaverse.controller;

import com.mangaverse.entity.Bookmark;
import com.mangaverse.entity.Comic;
import com.mangaverse.entity.User;
import com.mangaverse.entity.UserBadge;
import com.mangaverse.repository.BookmarkRepository;
import com.mangaverse.repository.ComicRepository;
import com.mangaverse.repository.UserBadgeRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkRepository   bookmarkRepo;
    private final UserRepository       userRepo;
    private final ComicRepository      comicRepo;
    private final UserBadgeRepository  badgeRepo;

    public BookmarkController(BookmarkRepository bookmarkRepo,
                              UserRepository userRepo,
                              ComicRepository comicRepo,
                              UserBadgeRepository badgeRepo) {
        this.bookmarkRepo = bookmarkRepo;
        this.userRepo     = userRepo;
        this.comicRepo    = comicRepo;
        this.badgeRepo    = badgeRepo;
    }

    // GET — all bookmarks for logged-in user
    @GetMapping
    public ResponseEntity<List<Bookmark>> getMyBookmarks(
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        return ResponseEntity.ok(bookmarkRepo.findByUserId(user.getId()));
    }

    // POST — add bookmark
    @PostMapping
    @Transactional
    public ResponseEntity<?> addBookmark(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody BookmarkRequest req) {

        User  user  = resolve(principal);
        Comic comic = comicRepo.findById(req.getComicId())
                .orElseThrow(() -> new RuntimeException("Comic not found"));

        if (bookmarkRepo.existsByUserIdAndComicId(user.getId(), comic.getId()))
            return ResponseEntity.badRequest().body(Map.of("message", "Already bookmarked."));

        Bookmark saved = bookmarkRepo.save(
            Bookmark.builder().user(user).comic(comic).build()
        );

        // Award FIRST_BOOKMARK badge on first ever bookmark
        if (!badgeRepo.existsByUserIdAndBadgeKey(user.getId(), "FIRST_BOOKMARK")) {
            UserBadge badge = new UserBadge();
            badge.setUser(user);
            badge.setBadgeKey("FIRST_BOOKMARK");
            badgeRepo.save(badge);
        }

        return ResponseEntity.ok(saved);
    }

    // DELETE — remove bookmark
    @DeleteMapping("/{comicId}")
    @Transactional
    public ResponseEntity<?> removeBookmark(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long comicId) {
        User user = resolve(principal);
        bookmarkRepo.deleteByUserIdAndComicId(user.getId(), comicId);
        return ResponseEntity.ok(Map.of("message", "Bookmark removed."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public static class BookmarkRequest {
        private Long comicId;
        public Long getComicId()       { return comicId; }
        public void setComicId(Long c) { this.comicId = c; }
    }
}
