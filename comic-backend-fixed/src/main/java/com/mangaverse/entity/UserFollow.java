package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_follows",
       uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id","following_id"}))
public class UserFollow {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    public Long getId()               { return id; }
    public User getFollower()         { return follower; }
    public User getFollowing()        { return following; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id)            { this.id = id; }
    public void setFollower(User u)       { this.follower = u; }
    public void setFollowing(User u)      { this.following = u; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
