package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "seasons")
public class Season {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "season_number")
    private int seasonNumber;

    @Column(name = "location")
    private String location;

    @Column(name = "premiere_date")
    private LocalDate premiereDate;

    @Column(name = "finale_date")
    private LocalDate finaleDate;

    @Column(name = "merge_episode")
    private Integer mergeEpisode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private SeasonStatus status;

    @Column(name = "winner_contestant_id")
    private Long winnerContestantId;

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getSeasonNumber() { return seasonNumber; }
    public String getLocation() { return location; }
    public LocalDate getPremiereDate() { return premiereDate; }
    public LocalDate getFinaleDate() { return finaleDate; }
    public Integer getMergeEpisode() { return mergeEpisode; }
    public SeasonStatus getStatus() { return status; }
    public Long getWinnerContestantId() { return winnerContestantId; }
}
