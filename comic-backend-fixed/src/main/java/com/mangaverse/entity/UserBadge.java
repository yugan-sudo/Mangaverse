package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","badge_key"}))
public class UserBadge {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_key", nullable = false)
    private String badgeKey; // e.g. FIRST_BOOKMARK, READ_100, NIGHT_OWL

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime earnedAt;

    public Long getId()                  { return id; }
    public User getUser()                { return user; }
    public String getBadgeKey()          { return badgeKey; }
    public LocalDateTime getEarnedAt()   { return earnedAt; }

    public void setId(Long id)               { this.id = id; }
    public void setUser(User u)              { this.user = u; }
    public void setBadgeKey(String k)        { this.badgeKey = k; }
    public void setEarnedAt(LocalDateTime v) { this.earnedAt = v; }
}
