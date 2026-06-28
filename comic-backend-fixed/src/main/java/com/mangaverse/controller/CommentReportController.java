package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentReportController {

    private final CommentReportRepository reportRepo;
    private final CommentRepository       commentRepo;
    private final UserRepository          userRepo;
    private final NotificationRepository  notifRepo;

    public CommentReportController(CommentReportRepository reportRepo,
                                   CommentRepository commentRepo,
                                   UserRepository userRepo,
                                   NotificationRepository notifRepo) {
        this.reportRepo  = reportRepo;
        this.commentRepo = commentRepo;
        this.userRepo    = userRepo;
        this.notifRepo   = notifRepo;
    }

    @PostMapping("/{commentId}/report")
    @Transactional
    public ResponseEntity<?> reportComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ReportRequest req) {

        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("message", "Please login to report."));

        User user = resolve(principal);

        if (reportRepo.existsByReporterIdAndCommentId(user.getId(), commentId))
            return ResponseEntity.badRequest().body(Map.of("message", "You already reported this comment."));

        Comment comment = commentRepo.findById(commentId).orElse(null);
        if (comment == null)
            return ResponseEntity.notFound().build();

        CommentReport report = reportRepo.save(
            CommentReport.builder()
                .comment(comment).reporter(user)
                .reason(req.getReason() != null ? req.getReason() : "OTHER")
                .details(req.getDetails())
                .build()
        );

        try {
            userRepo.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .forEach(admin -> notifRepo.save(
                    Notification.builder()
                        .user(admin)
                        .message("🚨 " + user.getUsername() + " reported a comment: \"" +
                                 comment.getContent().substring(0, Math.min(50, comment.getContent().length())) +
                                 (comment.getContent().length() > 50 ? "…" : "") + "\"")
                        .type("REPORT")
                        .referenceId(report.getId())
                        .build()
                ));
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of("message", "Comment reported. Admins have been notified."));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CommentReport>> getAllReports() {
        return ResponseEntity.ok(reportRepo.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/reports/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> reportCount() {
        return ResponseEntity.ok(Map.of(
            "pending", reportRepo.countByStatus("PENDING"),
            "total",   reportRepo.count()
        ));
    }

    @PutMapping("/reports/{reportId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateStatus(@PathVariable Long reportId,
                                           @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        reportRepo.findById(reportId).ifPresent(r -> {
            r.setStatus(newStatus);
            reportRepo.save(r);
        });
        return ResponseEntity.ok(Map.of("message", "Report updated."));
    }

    @DeleteMapping("/reports/{reportId}/delete-comment")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteReportedComment(@PathVariable Long reportId) {
        CommentReport report = reportRepo.findById(reportId).orElse(null);
        if (report == null) return ResponseEntity.notFound().build();

        Long commentId = report.getComment().getId();

        // FIX [Bug 2]: delete ALL reports referencing this comment first
        // (including the triggering report itself), then delete the comment.
        // Previously: setStatus("REVIEWED") then commentRepo.deleteById() —
        // the report row still had comment_id pointing at the now-deleted comment,
        // causing MySQL FK constraint violation:
        //   comment_reports.comment_id → comments.id
        reportRepo.deleteByCommentId(commentId);
        commentRepo.deleteById(commentId);

        return ResponseEntity.ok(Map.of("message", "Comment and all its reports deleted."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public static class ReportRequest {
        private String reason;
        private String details;
        public String getReason()          { return reason; }
        public String getDetails()         { return details; }
        public void   setReason(String r)  { this.reason = r; }
        public void   setDetails(String d) { this.details = d; }
    }
}
