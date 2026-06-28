package com.mangaverse.controller;

import com.mangaverse.entity.Banner;
import com.mangaverse.repository.BannerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/banners")
public class BannerController {

    private final BannerRepository bannerRepo;

    public BannerController(BannerRepository bannerRepo) {
        this.bannerRepo = bannerRepo;
    }

    // GET /api/banners?placement=HERO  — public
    @GetMapping
    public ResponseEntity<List<Banner>> getLive(
            @RequestParam(defaultValue = "HERO") String placement) {
        return ResponseEntity.ok(bannerRepo.findLiveByPlacement(placement));
    }

    // Admin CRUD ──────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    public ResponseEntity<List<Banner>> getAll() {
        return ResponseEntity.ok(bannerRepo.findAllByOrderBySortOrderAsc());
    }

    @PostMapping("/admin")
    public ResponseEntity<Banner> create(@RequestBody BannerRequest req) {
        Banner b = new Banner();
        applyRequest(b, req);
        return ResponseEntity.ok(bannerRepo.save(b));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<Banner> update(@PathVariable Long id, @RequestBody BannerRequest req) {
        Banner b = bannerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found: " + id));
        applyRequest(b, req);
        return ResponseEntity.ok(bannerRepo.save(b));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!bannerRepo.existsById(id)) return ResponseEntity.notFound().build();
        bannerRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Banner deleted."));
    }

    @PatchMapping("/admin/{id}/toggle")
    public ResponseEntity<Banner> toggle(@PathVariable Long id) {
        Banner b = bannerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found: " + id));
        b.setActive(!b.isActive());
        return ResponseEntity.ok(bannerRepo.save(b));
    }

    private void applyRequest(Banner b, BannerRequest req) {
        if (req.getTitle()       != null) b.setTitle(req.getTitle());
        if (req.getDescription() != null) b.setDescription(req.getDescription());
        if (req.getImageUrl()    != null) b.setImageUrl(req.getImageUrl());
        if (req.getLinkUrl()     != null) b.setLinkUrl(req.getLinkUrl());
        if (req.getLinkLabel()   != null) b.setLinkLabel(req.getLinkLabel());
        if (req.getPlacement()   != null) b.setPlacement(req.getPlacement());
        b.setActive(req.isActive());
        b.setSortOrder(req.getSortOrder());
        if (req.getStartsAt() != null && !req.getStartsAt().isBlank())
            b.setStartsAt(java.time.LocalDateTime.parse(req.getStartsAt()));
        else b.setStartsAt(null);
        if (req.getEndsAt() != null && !req.getEndsAt().isBlank())
            b.setEndsAt(java.time.LocalDateTime.parse(req.getEndsAt()));
        else b.setEndsAt(null);
    }

    public static class BannerRequest {
        private String title, description, imageUrl, linkUrl, linkLabel, placement, startsAt, endsAt;
        private boolean active = true;
        private int sortOrder = 0;
        public String  getTitle()       { return title; }       public void setTitle(String v)       { this.title=v; }
        public String  getDescription() { return description; } public void setDescription(String v) { this.description=v; }
        public String  getImageUrl()    { return imageUrl; }    public void setImageUrl(String v)    { this.imageUrl=v; }
        public String  getLinkUrl()     { return linkUrl; }     public void setLinkUrl(String v)     { this.linkUrl=v; }
        public String  getLinkLabel()   { return linkLabel; }   public void setLinkLabel(String v)   { this.linkLabel=v; }
        public String  getPlacement()   { return placement; }   public void setPlacement(String v)   { this.placement=v; }
        public String  getStartsAt()    { return startsAt; }    public void setStartsAt(String v)    { this.startsAt=v; }
        public String  getEndsAt()      { return endsAt; }      public void setEndsAt(String v)      { this.endsAt=v; }
        public boolean isActive()       { return active; }      public void setActive(boolean v)     { this.active=v; }
        public int     getSortOrder()   { return sortOrder; }   public void setSortOrder(int v)      { this.sortOrder=v; }
    }
}
