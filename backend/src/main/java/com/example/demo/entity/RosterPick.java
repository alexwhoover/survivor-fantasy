package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roster_picks")
public class RosterPick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "roster_id", nullable = false)
    private Long rosterId;

    @Column(name = "season_contestant_id", nullable = false)
    private Long seasonContestantId;

    public RosterPick() {}

    public RosterPick(Long rosterId, Long seasonContestantId) {
        this.rosterId = rosterId;
        this.seasonContestantId = seasonContestantId;
    }

    public Long getId() { return id; }
    public Long getRosterId() { return rosterId; }
    public Long getSeasonContestantId() { return seasonContestantId; }
}
