package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role = Role.USER;

    @Column(length = 5)
    private String themePreference = "dark";

    @Column(length = 50)
    private String displayName;

    @Column(length = 200)
    private String bio;

    @Column(length = 500)
    private String avatar = "👻";

    @Column(length = 200)
    private String favouriteGenres; // dark | light

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum Role { USER, ADMIN }

    public User() {}

    public User(Long id, String username, String email, String password, Role role, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.createdAt = createdAt;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public Role getRole() { return role; }
    public String getThemePreference() { return themePreference != null ? themePreference : "dark"; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(Role role) { this.role = role; }
    public void setThemePreference(String t) { this.themePreference = t; }
    public String getDisplayName()       { return displayName; }
    public void setDisplayName(String v) { this.displayName = v; }
    public String getBio()               { return bio; }
    public void setBio(String v)         { this.bio = v; }
    public String getAvatar()            { return avatar != null ? avatar : "👻"; }
    public void setAvatar(String v)      { this.avatar = v; }
    public String getFavouriteGenres()   { return favouriteGenres; }
    public void setFavouriteGenres(String v) { this.favouriteGenres = v; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String username;
        private String email;
        private String password;
        private Role role = Role.USER;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder role(Role role) { this.role = role; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public User build() {
            User u = new User();
            u.id = id; u.username = username; u.email = email;
            u.password = password; u.role = role; u.createdAt = createdAt;
            return u;
        }
    }

    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', email='" + email + "', role=" + role + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User u = (User) o;
        return id != null && id.equals(u.id);
    }

    @Override
    public int hashCode() { return id != null ? id.hashCode() : 0; }
}
