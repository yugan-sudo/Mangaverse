package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
public class Banner {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String imageUrl;

    private String linkUrl;     // where clicking the banner goes
    private String linkLabel;   // button label e.g. "Read Now"

    @Column(nullable = false)
    private String placement = "HERO"; // HERO | SIDEBAR | TOP_BAR

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int sortOrder = 0;

    @Column
    private LocalDateTime startsAt;

    @Column
    private LocalDateTime endsAt;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters
    public Long getId()                { return id; }
    public String getTitle()           { return title; }
    public String getDescription()     { return description; }
    public String getImageUrl()        { return imageUrl; }
    public String getLinkUrl()         { return linkUrl; }
    public String getLinkLabel()       { return linkLabel; }
    public String getPlacement()       { return placement; }
    public boolean isActive()          { return active; }
    public int getSortOrder()          { return sortOrder; }
    public LocalDateTime getStartsAt() { return startsAt; }
    public LocalDateTime getEndsAt()   { return endsAt; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
    public LocalDateTime getUpdatedAt(){ return updatedAt; }

    // Setters
    public void setId(Long id)                     { this.id = id; }
    public void setTitle(String t)                 { this.title = t; }
    public void setDescription(String d)           { this.description = d; }
    public void setImageUrl(String u)              { this.imageUrl = u; }
    public void setLinkUrl(String u)               { this.linkUrl = u; }
    public void setLinkLabel(String l)             { this.linkLabel = l; }
    public void setPlacement(String p)             { this.placement = p; }
    public void setActive(boolean a)               { this.active = a; }
    public void setSortOrder(int s)                { this.sortOrder = s; }
    public void setStartsAt(LocalDateTime v)       { this.startsAt = v; }
    public void setEndsAt(LocalDateTime v)         { this.endsAt = v; }
    public void setCreatedAt(LocalDateTime v)      { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)      { this.updatedAt = v; }

    public boolean isLive() {
        LocalDateTime now = LocalDateTime.now();
        return active
            && (startsAt == null || startsAt.isBefore(now))
            && (endsAt   == null || endsAt.isAfter(now));
    }
}
