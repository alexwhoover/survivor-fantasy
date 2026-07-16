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

    @Column(name = "picking_open", nullable = false)
    private boolean pickingOpen = true;

    @Column(name = "merge_episode")
    private Integer mergeEpisode;

    @Column(name = "merge_deadline")
    private LocalDateTime mergeDeadline;

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
    public boolean isPickingOpen() { return pickingOpen; }
    public void setPickingOpen(boolean pickingOpen) { this.pickingOpen = pickingOpen; }
    public Integer getMergeEpisode() { return mergeEpisode; }
    public void setMergeEpisode(Integer mergeEpisode) { this.mergeEpisode = mergeEpisode; }
    public LocalDateTime getMergeDeadline() { return mergeDeadline; }
    public void setMergeDeadline(LocalDateTime mergeDeadline) { this.mergeDeadline = mergeDeadline; }
    public int getContestantsPerTribe() { return contestantsPerTribe; }
    public void setContestantsPerTribe(int contestantsPerTribe) { this.contestantsPerTribe = contestantsPerTribe; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
