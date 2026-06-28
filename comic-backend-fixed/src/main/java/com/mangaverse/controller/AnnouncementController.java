package com.mangaverse.controller;

import com.mangaverse.entity.Announcement;
import com.mangaverse.repository.AnnouncementRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepo;

    public AnnouncementController(AnnouncementRepository announcementRepo) {
        this.announcementRepo = announcementRepo;
    }

    // GET /api/announcements — public: all active announcements
    @GetMapping
    public ResponseEntity<List<Announcement>> getAll() {
        return ResponseEntity.ok(announcementRepo.findActiveOrderByPinnedDesc());
    }

    // GET /api/announcements/latest?limit=3 — public: sidebar widget
    @GetMapping("/latest")
    public ResponseEntity<List<Announcement>> getLatest(
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(announcementRepo.findTopActive(limit));
    }
}
