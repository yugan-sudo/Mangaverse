package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chapter_reactions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","chapter_id","reaction_type"}))
public class ChapterReaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;
    @Column(name = "reaction_type", nullable = false)
    private String reactionType; // UPVOTE, FUNNY, LOVE, SURPRISED, ANGRY, SAD
    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    public Long getId()                  { return id; }
    public User getUser()                { return user; }
    public Long getChapterId()           { return chapterId; }
    public String getReactionType()      { return reactionType; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public void setId(Long id)           { this.id = id; }
    public void setUser(User u)          { this.user = u; }
    public void setChapterId(Long c)     { this.chapterId = c; }
    public void setReactionType(String r){ this.reactionType = r; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
