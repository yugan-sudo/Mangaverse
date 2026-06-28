package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","comic_id"}))
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    private Comic comic;

    @Column(nullable = false)
    private int stars; // 1-5

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private int helpfulCount = 0;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Long getId()              { return id; }
    public User getUser()            { return user; }
    public Comic getComic()          { return comic; }
    public int getStars()            { return stars; }
    public String getBody()          { return body; }
    public int getHelpfulCount()     { return helpfulCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id)               { this.id = id; }
    public void setUser(User u)              { this.user = u; }
    public void setComic(Comic c)            { this.comic = c; }
    public void setStars(int s)              { this.stars = s; }
    public void setBody(String b)            { this.body = b; }
    public void setHelpfulCount(int h)       { this.helpfulCount = h; }
    public void setCreatedAt(LocalDateTime v){ this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v){ this.updatedAt = v; }
}
