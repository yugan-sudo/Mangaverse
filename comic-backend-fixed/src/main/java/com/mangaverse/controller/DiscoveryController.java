package com.mangaverse.controller;

import com.mangaverse.entity.Comic;
import com.mangaverse.repository.BookmarkRepository;
import com.mangaverse.repository.ComicRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {

    private final ComicRepository comicRepo;
    private final BookmarkRepository bookmarkRepo;

    public DiscoveryController(ComicRepository comicRepo, BookmarkRepository bookmarkRepo) {
        this.comicRepo = comicRepo; this.bookmarkRepo = bookmarkRepo;
    }

    // Feature 16: Hot Right Now — comics with most recent bookmarks
    @GetMapping("/hot")
    public ResponseEntity<List<Map<String, Object>>> hot(@RequestParam(defaultValue = "10") int limit) {
        // Get all comics sorted by updatedAt — most recently active
        var comics = comicRepo.findAll(PageRequest.of(0, limit * 3, Sort.by("updatedAt").descending())).getContent();
        return ResponseEntity.ok(comics.stream().limit(limit).map(this::toMap).collect(Collectors.toList()));
    }

    // Feature 17: Genre landing page comics
    @GetMapping("/genre/{genre}")
    public ResponseEntity<Map<String, Object>> genrePage(@PathVariable String genre,
            @RequestParam(defaultValue = "20") int limit) {
        var all = comicRepo.findAll();
        var filtered = all.stream()
            .filter(c -> c.getGenre() != null && c.getGenre().toLowerCase().contains(genre.toLowerCase()))
            .sorted(Comparator.comparingLong(c -> -bookmarkCount(c.getId())))
            .limit(limit).map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("genre", genre, "comics", filtered, "total", filtered.size()));
    }

    // Feature 18: Author page
    @GetMapping("/author/{author}")
    public ResponseEntity<Map<String, Object>> authorPage(@PathVariable String author) {
        var comics = comicRepo.findAll().stream()
            .filter(c -> author.equalsIgnoreCase(c.getAuthor()))
            .sorted(Comparator.comparing(Comic::getTitle))
            .map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("author", author, "comics", comics, "total", comics.size()));
    }

    private long bookmarkCount(Long comicId) {
        try { return bookmarkRepo.countByUserId(comicId); } catch (Exception e) { return 0L; }
    }

    private Map<String, Object> toMap(Comic c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          c.getId());
        m.put("title",       c.getTitle());
        m.put("author",      c.getAuthor());
        m.put("genre",       c.getGenre());
        m.put("tags",        c.getTags());
        m.put("coverImage",  c.getCoverImage());
        m.put("status",      c.getStatus() != null ? c.getStatus().name() : "ONGOING");
        m.put("updatedAt",   c.getUpdatedAt());
        return m;
    }
}
