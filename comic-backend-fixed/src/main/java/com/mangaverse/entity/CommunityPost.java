package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_posts")
public class CommunityPost {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private String category = "general";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private int likes = 0;

    @Column(nullable = false)
    private int views = 0;

    @Column(nullable = false)
    private int commentCount = 0;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters
    public Long getId()              { return id; }
    public String getTitle()         { return title; }
    public String getBody()          { return body; }
    public String getCategory()      { return category; }
    public User getAuthor()          { return author; }
    public int getLikes()            { return likes; }
    public int getViews()            { return views; }
    public int getCommentCount()     { return commentCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id)              { this.id = id; }
    public void setTitle(String t)          { this.title = t; }
    public void setBody(String b)           { this.body = b; }
    public void setCategory(String c)       { this.category = c; }
    public void setAuthor(User u)           { this.author = u; }
    public void setLikes(int l)             { this.likes = l; }
    public void setViews(int v)             { this.views = v; }
    public void setCommentCount(int c)      { this.commentCount = c; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
    public void setUpdatedAt(LocalDateTime d) { this.updatedAt = d; }
}
