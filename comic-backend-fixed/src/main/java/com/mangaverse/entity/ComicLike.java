package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "comic_likes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","comic_id"}))
public class ComicLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Comic comic;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public ComicLike() {}
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Comic getComic() { return comic; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setComic(Comic comic) { this.comic = comic; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private User user; private Comic comic;
        public Builder user(User u) { this.user = u; return this; }
        public Builder comic(Comic c) { this.comic = c; return this; }
        public ComicLike build() { ComicLike l = new ComicLike(); l.user = user; l.comic = comic; return l; }
    }
}
