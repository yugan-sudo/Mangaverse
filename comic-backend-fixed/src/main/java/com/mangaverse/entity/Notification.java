package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String type; // NEW_CHAPTER, COMMENT, LIKE

    @Column
    private Long referenceId;

    // FIX: "read" is a reserved word in MySQL — renamed column to "is_read"
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Notification() {}

    // Getters
    public Long getId()               { return id; }
    public User getUser()             { return user; }
    public String getMessage()        { return message; }
    public String getType()           { return type; }
    public Long getReferenceId()      { return referenceId; }
    public boolean isRead()           { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id)                      { this.id = id; }
    public void setUser(User user)                  { this.user = user; }
    public void setMessage(String message)          { this.message = message; }
    public void setType(String type)                { this.type = type; }
    public void setReferenceId(Long referenceId)    { this.referenceId = referenceId; }
    public void setRead(boolean read)               { this.read = read; }
    public void setCreatedAt(LocalDateTime v)       { this.createdAt = v; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private String message, type;
        private Long referenceId;

        public Builder user(User u)           { this.user = u; return this; }
        public Builder message(String m)      { this.message = m; return this; }
        public Builder type(String t)         { this.type = t; return this; }
        public Builder referenceId(Long r)    { this.referenceId = r; return this; }

        public Notification build() {
            Notification n = new Notification();
            n.user = user; n.message = message;
            n.type = type; n.referenceId = referenceId;
            return n;
        }
    }
}
