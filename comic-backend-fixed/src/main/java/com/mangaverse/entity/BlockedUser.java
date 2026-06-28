package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_users",
       uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id","blocked_id"}))
public class BlockedUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;
    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    public Long getId()                  { return id; }
    public User getBlocker()             { return blocker; }
    public User getBlocked()             { return blocked; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public void setId(Long id)           { this.id = id; }
    public void setBlocker(User u)       { this.blocker = u; }
    public void setBlocked(User u)       { this.blocked = u; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
