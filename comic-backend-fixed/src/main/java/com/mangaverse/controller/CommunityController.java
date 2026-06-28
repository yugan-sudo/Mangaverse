package com.mangaverse.controller;

import com.mangaverse.entity.CommunityPost;
import com.mangaverse.entity.User;
import com.mangaverse.repository.CommunityPostRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityPostRepository postRepo;
    private final UserRepository          userRepo;

    public CommunityController(CommunityPostRepository postRepo, UserRepository userRepo) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
    }

    // GET /api/community/posts?page=0&size=10&sort=latest&category=general
    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(
            @RequestParam(defaultValue = "0")      int    page,
            @RequestParam(defaultValue = "10")     int    size,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false)        String category) {

        Sort springSort = switch (sort) {
            case "popular"  -> Sort.by("likes").descending();
            case "comments" -> Sort.by("commentCount").descending();
            default         -> Sort.by("createdAt").descending();
        };

        Pageable pageable = PageRequest.of(page, size, springSort);
        Page<CommunityPost> result = (category != null && !category.isBlank())
                ? postRepo.findByCategory(category, pageable)
                : postRepo.findAll(pageable);

        return ResponseEntity.ok(result.map(this::toDto));
    }

    // POST /api/community/posts  (authenticated)
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @RequestBody PostRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepo.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getTitle() == null || req.getTitle().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        if (req.getBody() == null || req.getBody().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));

        CommunityPost post = new CommunityPost();
        post.setTitle(req.getTitle().trim());
        post.setBody(req.getBody().trim());
        post.setCategory(req.getCategory() != null ? req.getCategory() : "general");
        post.setAuthor(user);

        return ResponseEntity.ok(toDto(postRepo.save(post)));
    }

    // POST /api/community/posts/{id}/like  (authenticated)
    @PostMapping("/posts/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id) {
        CommunityPost post = postRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
        post.setLikes(post.getLikes() + 1);
        postRepo.save(post);
        return ResponseEntity.ok(Map.of("likes", post.getLikes()));
    }

    // ── DTO ──────────────────────────────────────────────────────────────
    private Map<String, Object> toDto(CommunityPost p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           p.getId());
        m.put("title",        p.getTitle());
        m.put("body",         p.getBody());
        m.put("category",     p.getCategory());
        m.put("likes",        p.getLikes());
        m.put("views",        p.getViews());
        m.put("commentCount", p.getCommentCount());
        m.put("createdAt",    p.getCreatedAt());
        if (p.getAuthor() != null) {
            m.put("username", p.getAuthor().getUsername());
            Map<String, Object> author = new LinkedHashMap<>();
            author.put("username", p.getAuthor().getUsername());
            m.put("author", author);
        }
        return m;
    }

    // ── Request DTO ──────────────────────────────────────────────────────
    public static class PostRequest {
        private String title, body, category;
        public String getTitle()    { return title; }    public void setTitle(String t)    { this.title = t; }
        public String getBody()     { return body; }     public void setBody(String b)     { this.body = b; }
        public String getCategory() { return category; } public void setCategory(String c) { this.category = c; }
    }
}
