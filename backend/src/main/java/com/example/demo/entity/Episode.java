package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "episodes")
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "episode_number", nullable = false)
    private int episodeNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Episode() {}

    public Episode(Long leagueId, int episodeNumber, LocalDateTime createdAt) {
        this.leagueId = leagueId;
        this.episodeNumber = episodeNumber;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public int getEpisodeNumber() { return episodeNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
