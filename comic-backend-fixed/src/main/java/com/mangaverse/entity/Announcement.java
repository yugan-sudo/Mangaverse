package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String type = "INFO"; // INFO, WARNING, UPDATE, MAINTENANCE

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean pinned = false;

    @Column
    private java.time.LocalDateTime publishAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Announcement() {}

    // Getters
    public Long getId()                   { return id; }
    public String getTitle()              { return title; }
    public String getContent()            { return content; }
    public String getType()               { return type; }
    public boolean isActive()             { return active; }
    public boolean isPinned()             { return pinned; }
    public LocalDateTime getCreatedAt()   { return createdAt; }
    public LocalDateTime getUpdatedAt()   { return updatedAt; }

    // Setters
    public void setId(Long id)                        { this.id = id; }
    public void setTitle(String title)                { this.title = title; }
    public void setContent(String content)            { this.content = content; }
    public void setType(String type)                  { this.type = type; }
    public void setActive(boolean active)             { this.active = active; }
    public void setPinned(boolean pinned)             { this.pinned = pinned; }
    public void setCreatedAt(LocalDateTime v)         { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)         { this.updatedAt = v; }
    public java.time.LocalDateTime getPublishAt()         { return publishAt; }
    public void setPublishAt(java.time.LocalDateTime v)   { this.publishAt = v; }

    public boolean isLive() {
        return active && (publishAt == null || publishAt.isBefore(java.time.LocalDateTime.now()));
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String title, content, type = "INFO";
        private boolean active = true, pinned = false;

        public Builder title(String t)     { this.title = t; return this; }
        public Builder content(String c)   { this.content = c; return this; }
        public Builder type(String t)      { this.type = t; return this; }
        public Builder active(boolean a)   { this.active = a; return this; }
        public Builder pinned(boolean p)   { this.pinned = p; return this; }

        public Announcement build() {
            Announcement a = new Announcement();
            a.title = title; a.content = content; a.type = type;
            a.active = active; a.pinned = pinned;
            return a;
        }
    }
}
