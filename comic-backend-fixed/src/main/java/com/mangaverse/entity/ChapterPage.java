package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "chapter_pages")
public class ChapterPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    @JsonIgnore
    private Chapter chapter;

    @Column(nullable = false)
    private Integer pageNumber;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    public ChapterPage() {}

    public ChapterPage(Long id, Chapter chapter, Integer pageNumber, String imageUrl) {
        this.id = id; this.chapter = chapter;
        this.pageNumber = pageNumber; this.imageUrl = imageUrl;
    }

    // Getters
    public Long getId() { return id; }
    public Chapter getChapter() { return chapter; }
    public Integer getPageNumber() { return pageNumber; }
    public String getImageUrl() { return imageUrl; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setChapter(Chapter chapter) { this.chapter = chapter; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Chapter chapter;
        private Integer pageNumber;
        private String imageUrl;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder chapter(Chapter chapter) { this.chapter = chapter; return this; }
        public Builder pageNumber(Integer n) { this.pageNumber = n; return this; }
        public Builder imageUrl(String url) { this.imageUrl = url; return this; }

        public ChapterPage build() {
            ChapterPage p = new ChapterPage();
            p.id = id; p.chapter = chapter; p.pageNumber = pageNumber; p.imageUrl = imageUrl;
            return p;
        }
    }

    @Override
    public String toString() {
        return "ChapterPage{id=" + id + ", pageNumber=" + pageNumber + ", imageUrl='" + imageUrl + "'}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChapterPage)) return false;
        ChapterPage p = (ChapterPage) o;
        return id != null && id.equals(p.id);
    }

    @Override
    public int hashCode() { return id != null ? id.hashCode() : 0; }
}
