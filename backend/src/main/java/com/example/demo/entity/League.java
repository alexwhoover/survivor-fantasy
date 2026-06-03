package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leagues")
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    @Column(name = "pick_deadline")
    private LocalDateTime pickDeadline;

    @Column(name = "merge_episode")
    private Integer mergeEpisode;

    @Column(name = "current_episode")
    private int currentEpisode = 1;

    @Column(name = "contestants_per_tribe")
    private int contestantsPerTribe = 2;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public League() {}

    public League(String name, String code, Long seasonId, Long createdBy, LocalDateTime createdAt) {
        this.name = name;
        this.code = code;
        this.seasonId = seasonId;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public Long getSeasonId() { return seasonId; }
    public LocalDateTime getPickDeadline() { return pickDeadline; }
    public Integer getMergeEpisode() { return mergeEpisode; }
    public int getCurrentEpisode() { return currentEpisode; }
    public int getContestantsPerTribe() { return contestantsPerTribe; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
