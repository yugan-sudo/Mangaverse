package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","comic_id"}))
public class ReadingProgress {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    private Comic comic;

    @Column(nullable = false)
    private Long lastChapterId;

    @Column(nullable = false)
    private Integer lastChapterNumber;

    @Column(nullable = false)
    private int chaptersRead = 0;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Long getId()                    { return id; }
    public User getUser()                  { return user; }
    public Comic getComic()                { return comic; }
    public Long getLastChapterId()         { return lastChapterId; }
    public Integer getLastChapterNumber()  { return lastChapterNumber; }
    public int getChaptersRead()           { return chaptersRead; }
    public LocalDateTime getUpdatedAt()    { return updatedAt; }

    public void setId(Long id)                        { this.id = id; }
    public void setUser(User u)                       { this.user = u; }
    public void setComic(Comic c)                     { this.comic = c; }
    public void setLastChapterId(Long id)             { this.lastChapterId = id; }
    public void setLastChapterNumber(Integer n)       { this.lastChapterNumber = n; }
    public void setChaptersRead(int c)                { this.chaptersRead = c; }
    public void setUpdatedAt(LocalDateTime v)         { this.updatedAt = v; }
}
