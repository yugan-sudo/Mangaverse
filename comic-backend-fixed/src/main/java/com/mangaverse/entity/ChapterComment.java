package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chapter_comments")
public class ChapterComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which chapter this comment belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","pages","comic"})
    private Chapter chapter;

    // Who wrote the comment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Optional: which page number this comment refers to (null = general chapter comment)
    @Column
    private Integer pageNumber;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public ChapterComment() {}

    // Getters
    public Long getId()              { return id; }
    public Chapter getChapter()      { return chapter; }
    public User getUser()            { return user; }
    public String getContent()       { return content; }
    public Integer getPageNumber()   { return pageNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id)                   { this.id = id; }
    public void setChapter(Chapter chapter)      { this.chapter = chapter; }
    public void setUser(User user)               { this.user = user; }
    public void setContent(String content)       { this.content = content; }
    public void setPageNumber(Integer pageNumber){ this.pageNumber = pageNumber; }
    public void setCreatedAt(LocalDateTime v)    { this.createdAt = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Chapter chapter; private User user;
        private String content;  private Integer pageNumber;

        public Builder chapter(Chapter c)      { this.chapter = c; return this; }
        public Builder user(User u)            { this.user = u; return this; }
        public Builder content(String c)       { this.content = c; return this; }
        public Builder pageNumber(Integer p)   { this.pageNumber = p; return this; }

        public ChapterComment build() {
            ChapterComment cc = new ChapterComment();
            cc.chapter = chapter; cc.user = user;
            cc.content = content; cc.pageNumber = pageNumber;
            return cc;
        }
    }
}
