package com.mangaverse.controller;

import com.mangaverse.entity.Chapter;
import com.mangaverse.entity.ChapterPage;
import com.mangaverse.repository.ChapterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chapters")
public class ChapterController {

    private final ChapterRepository chapterRepo;

    public ChapterController(ChapterRepository chapterRepo) {
        this.chapterRepo = chapterRepo;
    }

    @GetMapping("/{id}/pages")
    public ResponseEntity<List<ChapterPage>> getPages(@PathVariable Long id) {
        return chapterRepo.findById(id)
                .map(ch -> ResponseEntity.ok(ch.getPages()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chapter> getChapter(@PathVariable Long id) {
        return chapterRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
