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

    @Column(name = "season_name", nullable = false)
    private String seasonName;

    @Column(name = "initial_picks_open", nullable = false)
    private boolean initialPicksOpen = true;

    @Column(name = "merge_picks_open", nullable = false)
    private boolean mergePicksOpen = false;

    @Column(name = "contestants_per_tribe")
    private int contestantsPerTribe = 2;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public League() {}

    public League(String name, String code, String seasonName, Long createdBy, LocalDateTime createdAt) {
        this.name = name;
        this.code = code;
        this.seasonName = seasonName;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getSeasonName() { return seasonName; }
    public boolean isInitialPicksOpen() { return initialPicksOpen; }
    public void setInitialPicksOpen(boolean initialPicksOpen) { this.initialPicksOpen = initialPicksOpen; }
    public boolean isMergePicksOpen() { return mergePicksOpen; }
    public void setMergePicksOpen(boolean mergePicksOpen) { this.mergePicksOpen = mergePicksOpen; }
    public int getContestantsPerTribe() { return contestantsPerTribe; }
    public void setContestantsPerTribe(int contestantsPerTribe) { this.contestantsPerTribe = contestantsPerTribe; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
