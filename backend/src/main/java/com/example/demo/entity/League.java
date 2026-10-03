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

    @Column(name = "season_name", nullable = false)
    private String seasonName;

    @Column(name = "archived", nullable = false)
    private boolean archived = false;

    @Column(name = "contestants_per_tribe")
    private int contestantsPerTribe = 2;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public League() {}

    public League(String name, String seasonName, LocalDateTime createdAt) {
        this.name = name;
        this.seasonName = seasonName;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSeasonName() { return seasonName; }
    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }
    public int getContestantsPerTribe() { return contestantsPerTribe; }
    public void setContestantsPerTribe(int contestantsPerTribe) { this.contestantsPerTribe = contestantsPerTribe; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
