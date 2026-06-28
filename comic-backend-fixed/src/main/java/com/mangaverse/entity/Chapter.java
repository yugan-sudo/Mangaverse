package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chapters")
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Comic comic;

    @Column(nullable = false)
    private Integer chapterNumber;

    @Column(length = 200)
    private String title;

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("pageNumber ASC")
    private List<ChapterPage> pages = new ArrayList<>();

    @Column
    private java.time.LocalDateTime scheduledAt; // null = already released

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Chapter() {}

    public Chapter(Long id, Comic comic, Integer chapterNumber, String title,
                   List<ChapterPage> pages, LocalDateTime createdAt) {
        this.id = id; this.comic = comic; this.chapterNumber = chapterNumber;
        this.title = title; this.pages = pages; this.createdAt = createdAt;
    }

    // Getters
    public Long getId() { return id; }
    public Comic getComic() { return comic; }
    public java.time.LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(java.time.LocalDateTime v) { this.scheduledAt = v; }
    public Integer getChapterNumber() { return chapterNumber; }
    public String getTitle() { return title; }
    public List<ChapterPage> getPages() { return pages; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setComic(Comic comic) { this.comic = comic; }
    public void setChapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; }
    public void setTitle(String title) { this.title = title; }
    public void setPages(List<ChapterPage> pages) { this.pages = pages; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Comic comic;
        private Integer chapterNumber;
        private String title;
        private List<ChapterPage> pages = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime scheduledAt;

        public Builder id(Long id)                     { this.id = id;                     return this; }
        public Builder comic(Comic comic)              { this.comic = comic;               return this; }
        public Builder chapterNumber(Integer n)        { this.chapterNumber = n;           return this; }
        public Builder title(String title)             { this.title = title;               return this; }
        public Builder pages(List<ChapterPage> pages)  { this.pages = pages;               return this; }
        public Builder createdAt(LocalDateTime v)      { this.createdAt = v;               return this; }
        // FIX: scheduledAt was accepted by the builder but never copied into
        // the built object, so any chapter pre-scheduled via builder was
        // silently made live immediately — the calendar showed nothing.
        public Builder scheduledAt(LocalDateTime v)    { this.scheduledAt = v;             return this; }

        public Chapter build() {
            Chapter c = new Chapter();
            c.id = id; c.comic = comic; c.chapterNumber = chapterNumber;
            c.title = title; c.pages = pages; c.createdAt = createdAt;
            c.scheduledAt = scheduledAt; // was missing before
            return c;
        }
    }

    @Override
    public String toString() {
        return "Chapter{id=" + id + ", chapterNumber=" + chapterNumber + ", title='" + title + "'}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Chapter)) return false;
        Chapter c = (Chapter) o;
        return id != null && id.equals(c.id);
    }

    @Override
    public int hashCode() { return id != null ? id.hashCode() : 0; }
}
