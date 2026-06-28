package com.mangaverse.controller;

import com.mangaverse.entity.Comment;
import com.mangaverse.entity.CommentReply;
import com.mangaverse.entity.User;
import com.mangaverse.repository.CommentRepository;
import com.mangaverse.repository.CommentReplyRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments/{commentId}/replies")
public class CommentReplyController {

    private final CommentReplyRepository replyRepo;
    private final CommentRepository      commentRepo;
    private final UserRepository         userRepo;

    public CommentReplyController(CommentReplyRepository replyRepo,
                                  CommentRepository commentRepo,
                                  UserRepository userRepo) {
        this.replyRepo   = replyRepo;
        this.commentRepo = commentRepo;
        this.userRepo    = userRepo;
    }

    // GET — all replies for a comment (public)
    @GetMapping
    public ResponseEntity<List<CommentReply>> getReplies(@PathVariable Long commentId) {
        return ResponseEntity.ok(replyRepo.findByCommentIdOrderByCreatedAtAsc(commentId));
    }

    // POST — reply to a comment
    @PostMapping
    @Transactional
    public ResponseEntity<?> addReply(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ReplyRequest req) {

        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Reply cannot be empty."));

        User    user    = resolve(principal);
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        CommentReply saved = replyRepo.save(
            CommentReply.builder()
                .comment(comment)
                .user(user)
                .content(req.getContent().trim())
                .replyToUsername(req.getReplyToUsername())
                .build()
        );
        return ResponseEntity.ok(saved);
    }

    // DELETE — remove own reply
    @DeleteMapping("/{replyId}")
    @Transactional
    public ResponseEntity<?> deleteReply(
            @PathVariable Long commentId,
            @PathVariable Long replyId,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolve(principal);
        replyRepo.deleteByIdAndUserId(replyId, user.getId());
        return ResponseEntity.ok(Map.of("message", "Reply deleted."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public static class ReplyRequest {
        private String content;
        private String replyToUsername; // the @username being replied to

        public String getContent()            { return content; }
        public String getReplyToUsername()    { return replyToUsername; }
        public void   setContent(String c)    { this.content = c; }
        public void   setReplyToUsername(String u){ this.replyToUsername = u; }
    }
}
