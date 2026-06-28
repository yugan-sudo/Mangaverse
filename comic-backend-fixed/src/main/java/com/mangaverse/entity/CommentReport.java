package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_reports")
public class CommentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Comment being reported
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Comment comment;

    // User who reported
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User reporter;

    // Reason: SPAM, HATE, SPOILER, INAPPROPRIATE, OTHER
    @Column(nullable = false, length = 30)
    private String reason;

    @Column(length = 300)
    private String details;

    // Admin review status: PENDING, REVIEWED, DISMISSED
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public CommentReport() {}

    public Long getId()              { return id; }
    public Comment getComment()      { return comment; }
    public User getReporter()        { return reporter; }
    public String getReason()        { return reason; }
    public String getDetails()       { return details; }
    public String getStatus()        { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id)             { this.id = id; }
    public void setComment(Comment c)      { this.comment = c; }
    public void setReporter(User u)        { this.reporter = u; }
    public void setReason(String r)        { this.reason = r; }
    public void setDetails(String d)       { this.details = d; }
    public void setStatus(String s)        { this.status = s; }
    public void setCreatedAt(LocalDateTime v){ this.createdAt = v; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Comment comment; private User reporter;
        private String reason; private String details;
        public Builder comment(Comment c)  { this.comment = c; return this; }
        public Builder reporter(User u)    { this.reporter = u; return this; }
        public Builder reason(String r)    { this.reason = r; return this; }
        public Builder details(String d)   { this.details = d; return this; }
        public CommentReport build() {
            CommentReport r = new CommentReport();
            r.comment = comment; r.reporter = reporter;
            r.reason = reason;   r.details = details;
            return r;
        }
    }
}
