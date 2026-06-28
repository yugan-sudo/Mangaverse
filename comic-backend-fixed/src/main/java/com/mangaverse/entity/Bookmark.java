package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookmarks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "comic_id"}))
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Comic comic;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Bookmark() {}

    public Bookmark(Long id, User user, Comic comic, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.comic = comic; this.createdAt = createdAt;
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Comic getComic() { return comic; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setComic(Comic comic) { this.comic = comic; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User user;
        private Comic comic;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder comic(Comic comic) { this.comic = comic; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }

        public Bookmark build() {
            Bookmark b = new Bookmark();
            b.id = id; b.user = user; b.comic = comic; b.createdAt = createdAt;
            return b;
        }
    }

    @Override
    public String toString() {
        return "Bookmark{id=" + id + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Bookmark)) return false;
        Bookmark b = (Bookmark) o;
        return id != null && id.equals(b.id);
    }

    @Override
    public int hashCode() { return id != null ? id.hashCode() : 0; }
}
