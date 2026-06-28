package com.mangaverse.controller;

import com.mangaverse.entity.Chapter;
import com.mangaverse.entity.ChapterComment;
import com.mangaverse.entity.User;
import com.mangaverse.repository.ChapterCommentRepository;
import com.mangaverse.repository.ChapterRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chapters/{chapterId}/comments")
public class ChapterCommentController {

    private final ChapterCommentRepository commentRepo;
    private final ChapterRepository        chapterRepo;
    private final UserRepository           userRepo;

    public ChapterCommentController(ChapterCommentRepository commentRepo,
                                    ChapterRepository chapterRepo,
                                    UserRepository userRepo) {
        this.commentRepo = commentRepo;
        this.chapterRepo = chapterRepo;
        this.userRepo    = userRepo;
    }

    // GET — all comments for a chapter (public, no login needed)
    @GetMapping
    public ResponseEntity<List<ChapterComment>> getComments(@PathVariable Long chapterId) {
        return ResponseEntity.ok(commentRepo.findByChapterIdOrderByCreatedAtDesc(chapterId));
    }

    // POST — post a comment on a chapter
    @PostMapping
    @Transactional
    public ResponseEntity<?> addComment(
            @PathVariable Long chapterId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody CommentRequest req) {

        // Validate content
        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Comment cannot be empty."));

        User user = resolve(principal);
        Chapter chapter = chapterRepo.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        ChapterComment saved = commentRepo.save(
            ChapterComment.builder()
                .chapter(chapter)
                .user(user)
                .content(req.getContent().trim())
                .pageNumber(req.getPageNumber()) // optional page number
                .build()
        );
        return ResponseEntity.ok(saved);
    }

    // DELETE — remove own comment
    @DeleteMapping("/{commentId}")
    @Transactional
    public ResponseEntity<?> deleteComment(
            @PathVariable Long chapterId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        commentRepo.deleteByIdAndUserId(commentId, user.getId());
        return ResponseEntity.ok(Map.of("message", "Comment deleted."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Request DTO
    public static class CommentRequest {
        private String content;
        private Integer pageNumber; // optional — which page they're commenting on

        public String  getContent()            { return content; }
        public Integer getPageNumber()         { return pageNumber; }
        public void    setContent(String c)    { this.content = c; }
        public void    setPageNumber(Integer p){ this.pageNumber = p; }
    }
}
