package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/me/blocked")
public class BlockedUserController {

    private final UserRepository userRepo;
    private final BlockedUserRepository blockedRepo;

    public BlockedUserController(UserRepository userRepo, BlockedUserRepository blockedRepo) {
        this.userRepo = userRepo;
        this.blockedRepo = blockedRepo;
    }

    // GET /api/me/blocked — list users I've blocked
    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User me = userRepo.findByUsername(principal.getUsername()).orElseThrow();

        List<Map<String, Object>> result = new ArrayList<>();
        for (BlockedUser b : blockedRepo.findByBlockerId(me.getId())) {
            User u = b.getBlocked();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("blockedAt", b.getCreatedAt());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/me/blocked/{username} — block a user
    @PostMapping("/{username}")
    public ResponseEntity<?> block(@PathVariable String username,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User me = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        User target = userRepo.findByUsername(username).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();
        if (target.getId().equals(me.getId()))
            return ResponseEntity.badRequest().body(Map.of("error", "You can't block yourself"));

        if (!blockedRepo.existsByBlockerIdAndBlockedId(me.getId(), target.getId())) {
            BlockedUser b = new BlockedUser();
            b.setBlocker(me);
            b.setBlocked(target);
            blockedRepo.save(b);
        }
        return ResponseEntity.ok(Map.of("blocked", true, "username", target.getUsername()));
    }

    // DELETE /api/me/blocked/{username} — unblock a user
    @DeleteMapping("/{username}")
    public ResponseEntity<?> unblock(@PathVariable String username,
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User me = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        User target = userRepo.findByUsername(username).orElse(null);
        if (target == null) return ResponseEntity.notFound().build();

        blockedRepo.findByBlockerIdAndBlockedId(me.getId(), target.getId())
                .ifPresent(blockedRepo::delete);
        return ResponseEntity.ok(Map.of("blocked", false, "username", target.getUsername()));
    }

    // GET /api/me/blocked/ids — lightweight list of blocked user IDs (for client-side filtering)
    @GetMapping("/ids")
    public ResponseEntity<?> ids(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.ok(List.of());
        User me = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        List<Long> ids = blockedRepo.findByBlockerId(me.getId()).stream()
                .map(b -> b.getBlocked().getId()).toList();
        return ResponseEntity.ok(ids);
    }
}
