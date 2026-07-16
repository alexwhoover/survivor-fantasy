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

    @Column(name = "contestant_id", nullable = false)
    private Long contestantId;

    public RosterPick() {}

    public RosterPick(Long rosterId, Long contestantId) {
        this.rosterId = rosterId;
        this.contestantId = contestantId;
    }

    public Long getId() { return id; }
    public Long getRosterId() { return rosterId; }
    public Long getContestantId() { return contestantId; }
}
