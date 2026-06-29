package com.mangaverse.controller;

import com.mangaverse.entity.Chapter;
import com.mangaverse.entity.Comic;
import com.mangaverse.entity.Comic.Status;
import com.mangaverse.repository.ChapterRepository;
import com.mangaverse.repository.ComicRepository;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comics")
public class ComicController {

    private final ComicRepository   comicRepo;
    private final ChapterRepository chapterRepo;

    public ComicController(ComicRepository comicRepo, ChapterRepository chapterRepo) {
        this.comicRepo   = comicRepo;
        this.chapterRepo = chapterRepo;
    }

    // ── helper: attach chapter count to each comic ──────────────────────
    private void attachChapterCount(List<Comic> comics) {
        comics.forEach(c ->
            c.setTotalChapters((int) chapterRepo.countByComicId(c.getId()))
        );
    }

    private void attachChapterCount(Comic comic) {
        comic.setTotalChapters((int) chapterRepo.countByComicId(comic.getId()));
    }

    // GET — browse comics with search / genre / tag / status / sort + chapter counts
    @GetMapping
    public ResponseEntity<Page<Comic>> getAll(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")       int    page,
            @RequestParam(defaultValue = "24")      int    size,
            @RequestParam(defaultValue = "newest")  String sort) {

        Sort sortOrder = switch (sort) {
            case "popular"  -> Sort.by(Sort.Order.desc("id"));
            case "updated"  -> Sort.by(Sort.Order.desc("updatedAt"));
            case "rating"   -> Sort.by(Sort.Order.desc("id"));
            case "title"    -> Sort.by(Sort.Order.asc("title").ignoreCase());
            default         -> Sort.by(Sort.Order.desc("createdAt"));
        };
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        // Pass empty strings instead of null to prevent PostgreSQL bytea type inference errors in CONCAT/LOWER
        String qClean      = (q      != null && !q.isBlank())      ? q.trim()      : "";
        String genreClean  = (genre  != null && !genre.isBlank())  ? genre.trim()  : "";
        String tagClean    = (tag    != null && !tag.isBlank())    ? tag.trim()    : "";
        String statusClean = (status != null && !status.isBlank()) ? status.trim() : null;

        // Convert status string → enum (null-safe)
        Status statusEnum = null;
        if (statusClean != null) {
            try { statusEnum = Status.valueOf(statusClean.toUpperCase()); }
            catch (IllegalArgumentException ignored) { /* unknown status value — ignore */ }
        }

        boolean hasFilter = !qClean.isEmpty() || !genreClean.isEmpty() || !tagClean.isEmpty() || statusEnum != null;
        Page<Comic> result = hasFilter
            ? comicRepo.searchWithFilter(qClean, genreClean, tagClean, statusEnum, pageable)
            : comicRepo.findAll(pageable);

        attachChapterCount(result.getContent());
        return ResponseEntity.ok(result);
    }

    // GET — search suggestions (autocomplete)
    @GetMapping("/suggestions")
    public ResponseEntity<List<Comic>> getSuggestions(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) return ResponseEntity.ok(List.of());
        List<Comic> results = comicRepo.findSuggestions(q.trim(), PageRequest.of(0, 8));
        attachChapterCount(results);
        return ResponseEntity.ok(results);
    }

    // GET — 5 most recently updated comics (realtime banner)
    @GetMapping("/recent")
    public ResponseEntity<List<Comic>> getRecent(
            @RequestParam(defaultValue = "5") int size) {
        List<Comic> result = comicRepo
            .findAll(PageRequest.of(0, size, Sort.by("updatedAt").descending()))
            .getContent();
        attachChapterCount(result);
        return ResponseEntity.ok(result);
    }

    // GET — single comic by ID
    @GetMapping("/{id}")
    public ResponseEntity<Comic> getById(@PathVariable Long id) {
        return comicRepo.findById(id).map(c -> {
            attachChapterCount(c);
            return ResponseEntity.ok(c);
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET — chapters for a comic
    @GetMapping("/{id}/chapters")
    public ResponseEntity<List<Chapter>> getChapters(@PathVariable Long id) {
        return ResponseEntity.ok(chapterRepo.findByComicIdOrderByChapterNumberAsc(id));
    }
}
