package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "author_follows",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","author_name"}))
public class AuthorFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;

    // Author stored as name string (no separate Author entity needed)
    @Column(name = "author_name", nullable = false, length = 100)
    private String authorName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime followedAt;

    public AuthorFollow() {}
    public Long getId()               { return id; }
    public User getUser()             { return user; }
    public String getAuthorName()     { return authorName; }
    public LocalDateTime getFollowedAt() { return followedAt; }
    public void setId(Long id)               { this.id = id; }
    public void setUser(User user)           { this.user = user; }
    public void setAuthorName(String name)   { this.authorName = name; }
    public void setFollowedAt(LocalDateTime v){ this.followedAt = v; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private User user; private String authorName;
        public Builder user(User u)          { this.user = u; return this; }
        public Builder authorName(String n)  { this.authorName = n; return this; }
        public AuthorFollow build() {
            AuthorFollow af = new AuthorFollow();
            af.user = user; af.authorName = authorName; return af;
        }
    }
}
