package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_replies")
public class CommentReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Parent comment this reply belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Comment comment;

    // Who wrote the reply
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // @username the reply is directed at
    @Column(length = 50)
    private String replyToUsername;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public CommentReply() {}

    public Long getId()                  { return id; }
    public Comment getComment()          { return comment; }
    public User getUser()                { return user; }
    public String getContent()           { return content; }
    public String getReplyToUsername()   { return replyToUsername; }
    public LocalDateTime getCreatedAt()  { return createdAt; }

    public void setId(Long id)                       { this.id = id; }
    public void setComment(Comment comment)          { this.comment = comment; }
    public void setUser(User user)                   { this.user = user; }
    public void setContent(String content)           { this.content = content; }
    public void setReplyToUsername(String username)  { this.replyToUsername = username; }
    public void setCreatedAt(LocalDateTime v)        { this.createdAt = v; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Comment comment; private User user;
        private String content;  private String replyToUsername;
        public Builder comment(Comment c)          { this.comment = c; return this; }
        public Builder user(User u)                { this.user = u; return this; }
        public Builder content(String c)           { this.content = c; return this; }
        public Builder replyToUsername(String u)   { this.replyToUsername = u; return this; }
        public CommentReply build() {
            CommentReply r = new CommentReply();
            r.comment = comment; r.user = user;
            r.content = content; r.replyToUsername = replyToUsername;
            return r;
        }
    }
}
