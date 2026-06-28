package com.mangaverse.controller;

import com.mangaverse.entity.Notification;
import com.mangaverse.entity.User;
import com.mangaverse.repository.NotificationRepository;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifRepo;
    private final UserRepository         userRepo;

    public NotificationController(NotificationRepository notifRepo, UserRepository userRepo) {
        this.notifRepo = notifRepo;
        this.userRepo  = userRepo;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAll(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notifRepo.findByUserIdOrderByCreatedAtDesc(resolve(principal).getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(Map.of("count",
            notifRepo.countByUserIdAndReadFalse(resolve(principal).getId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetails principal) {
        notifRepo.findById(id).ifPresent(n -> { n.setRead(true); notifRepo.save(n); });
        return ResponseEntity.ok(Map.of("message", "Marked as read."));
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails principal) {
        Long userId = resolve(principal).getId();
        notifRepo.findByUserIdOrderByCreatedAtDesc(userId)
                 .forEach(n -> { n.setRead(true); notifRepo.save(n); });
        return ResponseEntity.ok(Map.of("message", "All marked as read."));
    }

    // FIX: dismiss a single notification — was missing, so the ✕ button
    // had no backend to call and the notification reappeared on next page load.
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> dismiss(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetails principal) {
        Long userId = resolve(principal).getId();
        notifRepo.findById(id).ifPresent(n -> {
            // Only delete if it belongs to this user
            if (n.getUser().getId().equals(userId)) notifRepo.deleteById(id);
        });
        return ResponseEntity.ok(Map.of("message", "Notification dismissed."));
    }

    // FIX: clear ALL notifications for the user — was missing, so the
    // "Clear all" button had no endpoint to call.
    @DeleteMapping("/all")
    @Transactional
    public ResponseEntity<?> clearAll(@AuthenticationPrincipal UserDetails principal) {
        Long userId = resolve(principal).getId();
        notifRepo.deleteByUserId(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications cleared."));
    }

    private User resolve(UserDetails principal) {
        return userRepo.findByUsername(principal.getUsername())
                       .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
