package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "comics")
public class Comic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 100)
    private String author;

    @Column(length = 100)
    private String genre;

    @Column(length = 500)
    private String tags;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String coverImage;

    // Not stored in DB — populated by controller for API responses
    // Used by frontend to show "Ch. 12 / 45 read" progress bar
    @Transient
    private Integer totalChapters;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ONGOING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Status { ONGOING, COMPLETED, HIATUS }

    public Comic() {}

    public Comic(Long id, String title, String author, String genre, String description,
                 String coverImage, Status status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id; this.title = title; this.author = author; this.genre = genre;
        this.description = description; this.coverImage = coverImage;
        this.status = status; this.createdAt = createdAt; this.updatedAt = updatedAt;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getGenre() { return genre; }
    public String getTags()  { return tags; }
    public String getDescription() { return description; }
    public String getCoverImage() { return coverImage; }
    public Integer getTotalChapters() { return totalChapters; }
    public Status getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setAuthor(String author) { this.author = author; }
    public void setGenre(String genre) { this.genre = genre; }
    public void setTags(String t)      { this.tags = t; }
    public void setDescription(String description) { this.description = description; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public void setTotalChapters(Integer totalChapters) { this.totalChapters = totalChapters; }
    public void setStatus(Status status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String title, author, genre, description, coverImage, tags;
        private Status status = Status.ONGOING;
        private LocalDateTime createdAt, updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder author(String author) { this.author = author; return this; }
        public Builder genre(String genre) { this.genre = genre; return this; }
        public Builder tags(String t) { this.tags = t; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder coverImage(String coverImage) { this.coverImage = coverImage; return this; }
        public Builder status(Status status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }
        public Builder updatedAt(LocalDateTime v) { this.updatedAt = v; return this; }

        public Comic build() {
            Comic c = new Comic();
            c.id = id; c.title = title; c.author = author; c.genre = genre;
            // FIX: tags was captured by the Builder.tags() setter but never
            // copied onto the constructed Comic instance here — so any comic
            // created via Comic.builder()...tags(x).build() (i.e. AdminController
            // .addComic()) silently lost its tags at the exact moment the object
            // was created, even though the builder "accepted" the value with no
            // error. This is why tags appeared to save successfully but never
            // showed up again on reload for comics created through Add Comic.
            c.tags = tags;
            c.description = description; c.coverImage = coverImage;
            c.status = status; c.createdAt = createdAt; c.updatedAt = updatedAt;
            return c;
        }
    }

    @Override
    public String toString() {
        return "Comic{id=" + id + ", title='" + title + "', author='" + author + "'}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Comic)) return false;
        Comic c = (Comic) o;
        return id != null && id.equals(c.id);
    }

    @Override
    public int hashCode() { return id != null ? id.hashCode() : 0; }
}
