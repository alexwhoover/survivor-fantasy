package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "episode_scores")
public class EpisodeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contestant_id", nullable = false)
    private Long contestantId;

    @Column(name = "episode_number", nullable = false)
    private int episodeNumber;

    @Column(name = "points", nullable = false)
    private int points;

    public EpisodeScore() {}

    public EpisodeScore(Long contestantId, int episodeNumber, int points) {
        this.contestantId = contestantId;
        this.episodeNumber = episodeNumber;
        this.points = points;
    }

    public Long getId() { return id; }
    public Long getContestantId() { return contestantId; }
    public int getEpisodeNumber() { return episodeNumber; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}
