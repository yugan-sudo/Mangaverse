package com.mangaverse.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reading_streaks")
public class ReadingStreak {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private int currentStreak = 0;

    @Column(nullable = false)
    private int longestStreak = 0;

    @Column
    private LocalDate lastReadDate;

    public Long getUserId()            { return userId; }
    public int getCurrentStreak()      { return currentStreak; }
    public int getLongestStreak()      { return longestStreak; }
    public LocalDate getLastReadDate() { return lastReadDate; }

    public void setUserId(Long id)             { this.userId = id; }
    public void setCurrentStreak(int s)        { this.currentStreak = s; }
    public void setLongestStreak(int s)        { this.longestStreak = s; }
    public void setLastReadDate(LocalDate d)   { this.lastReadDate = d; }
}
