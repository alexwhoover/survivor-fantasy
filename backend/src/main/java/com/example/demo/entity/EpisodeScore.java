package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "episode_scores")
public class EpisodeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_contestant_id", nullable = false)
    private Long seasonContestantId;

    @Column(name = "episode_number", nullable = false)
    private int episodeNumber;

    @Column(name = "points", nullable = false)
    private int points;

    public EpisodeScore() {}

    public EpisodeScore(Long seasonContestantId, int episodeNumber, int points) {
        this.seasonContestantId = seasonContestantId;
        this.episodeNumber = episodeNumber;
        this.points = points;
    }

    public Long getId() { return id; }
    public Long getSeasonContestantId() { return seasonContestantId; }
    public int getEpisodeNumber() { return episodeNumber; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}
