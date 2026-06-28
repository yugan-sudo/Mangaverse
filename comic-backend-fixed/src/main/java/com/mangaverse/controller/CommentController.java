package com.mangaverse.controller;

import com.mangaverse.entity.Comment;
import com.mangaverse.entity.Comic;
import com.mangaverse.entity.Notification;
import com.mangaverse.entity.User;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comics/{comicId}/comments")
public class CommentController {

    private final CommentRepository       commentRepo;
    private final ComicRepository         comicRepo;
    private final UserRepository          userRepo;
    private final NotificationRepository  notifRepo;
    private final BookmarkRepository      bookmarkRepo;
    private final CommentReportRepository reportRepo;   // FIX [Bug 2]

    public CommentController(CommentRepository commentRepo, ComicRepository comicRepo,
                             UserRepository userRepo, NotificationRepository notifRepo,
                             BookmarkRepository bookmarkRepo,
                             CommentReportRepository reportRepo) {
        this.commentRepo  = commentRepo;
        this.comicRepo    = comicRepo;
        this.userRepo     = userRepo;
        this.notifRepo    = notifRepo;
        this.bookmarkRepo = bookmarkRepo;
        this.reportRepo   = reportRepo;
    }

    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long comicId) {
        return ResponseEntity.ok(commentRepo.findByComicIdOrderByCreatedAtDesc(comicId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> addComment(
            @PathVariable Long comicId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody CommentRequest req) {

        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Comment cannot be empty."));

        User  user  = resolve(principal);
        Comic comic = comicRepo.findById(comicId).orElse(null);
        if (comic == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Comic not found."));

        Comment saved = commentRepo.save(
            Comment.builder().comic(comic).user(user).content(req.getContent().trim()).build()
        );

        try {
            bookmarkRepo.findByComicId(comicId).stream()
                .filter(bk -> !bk.getUser().getId().equals(user.getId()))
                .limit(50)
                .forEach(bk -> notifRepo.save(Notification.builder()
                    .user(bk.getUser())
                    .message(user.getUsername() + " commented on " + comic.getTitle())
                    .type("COMMENT")
                    .referenceId(comicId)
                    .build()));
        } catch (Exception ignored) {}

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{commentId}")
    @Transactional
    public ResponseEntity<?> deleteComment(
            @PathVariable Long comicId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);

        Comment comment = commentRepo.findById(commentId).orElse(null);
        if (comment == null) return ResponseEntity.notFound().build();

        // Verify ownership — only the author can delete their own comment here
        if (!comment.getUser().getId().equals(user.getId()))
            return ResponseEntity.status(403).body(Map.of("message", "Not your comment."));

        // FIX [Bug 2]: delete all reports referencing this comment FIRST,
        // otherwise MySQL fires a FK constraint violation:
        //   comment_reports.comment_id → comments.id
        reportRepo.deleteByCommentId(commentId);
        commentRepo.deleteById(commentId);

        return ResponseEntity.ok(Map.of("message", "Comment deleted."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public static class CommentRequest {
        private String content;
        public String getContent()         { return content; }
        public void   setContent(String c) { this.content = c; }
    }
}
