package com.mangaverse.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
public class ContactMessage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String subject = "general";

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false)
    private String status = "UNREAD"; // UNREAD, READ, RESOLVED

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    // Getters
    public Long getId()              { return id; }
    public String getName()          { return name; }
    public String getEmail()         { return email; }
    public String getSubject()       { return subject; }
    public String getMessage()       { return message; }
    public String getStatus()        { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id)          { this.id = id; }
    public void setName(String n)       { this.name = n; }
    public void setEmail(String e)      { this.email = e; }
    public void setSubject(String s)    { this.subject = s; }
    public void setMessage(String m)    { this.message = m; }
    public void setStatus(String s)     { this.status = s; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
}
