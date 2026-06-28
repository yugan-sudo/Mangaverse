package com.mangaverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "ratings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","comic_id"}))
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Comic comic;

    // 1 to 5 stars
    @Column(nullable = false)
    private Integer stars;

    public Rating() {}

    public Long getId()    { return id; }
    public User getUser()  { return user; }
    public Comic getComic(){ return comic; }
    public Integer getStars() { return stars; }

    public void setId(Long id)       { this.id = id; }
    public void setUser(User user)   { this.user = user; }
    public void setComic(Comic comic){ this.comic = comic; }
    public void setStars(Integer stars) { this.stars = stars; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private User user; private Comic comic; private Integer stars;
        public Builder user(User u)    { this.user = u; return this; }
        public Builder comic(Comic c)  { this.comic = c; return this; }
        public Builder stars(Integer s){ this.stars = s; return this; }
        public Rating build() {
            Rating r = new Rating();
            r.user = user; r.comic = comic; r.stars = stars;
            return r;
        }
    }
}
