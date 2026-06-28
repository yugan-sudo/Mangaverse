package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Comic comic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    // FIX: use ignoreUnknown=true so Jackson never throws on unexpected fields.
    // Only serialise id, username, avatar — the three fields the frontend needs:
    //   id       → isOwn check (user.id === currentUser.id as a fallback)
    //   username → display name in comment + isOwn check
    //   avatar   → avatar image/emoji rendering
    // All other User fields are suppressed here to keep the response lean and
    // avoid accidentally exposing email, role, or any future sensitive field.
    @JsonIgnoreProperties(ignoreUnknown = true, value = {
        "hibernateLazyInitializer", "handler",
        "password", "email", "role",
        "themePreference", "displayName", "bio",
        "favouriteGenres", "createdAt"
    })
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Comment() {}

    public Long          getId()        { return id; }
    public Comic         getComic()     { return comic; }
    public User          getUser()      { return user; }
    public String        getContent()   { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id)                        { this.id = id; }
    public void setComic(Comic comic)                 { this.comic = comic; }
    public void setUser(User user)                    { this.user = user; }
    public void setContent(String content)            { this.content = content; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id; private Comic comic; private User user; private String content;
        public Builder id(Long id)             { this.id = id;           return this; }
        public Builder comic(Comic comic)      { this.comic = comic;     return this; }
        public Builder user(User user)         { this.user = user;       return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Comment build() {
            Comment c = new Comment();
            c.id = id; c.comic = comic; c.user = user; c.content = content;
            return c;
        }
    }
}
