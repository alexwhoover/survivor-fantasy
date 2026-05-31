package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "season_contestants")
public class SeasonContestant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contestant_id")
    private Contestant contestant;

    @Column(name = "eliminated_episode")
    private Integer eliminatedEpisode;

    @Column(name = "finish_place")
    private Integer finishPlace;

    @Column(name = "winner")
    private boolean winner;

    public Long getId() { return id; }
    public Long getSeasonId() { return seasonId; }
    public Contestant getContestant() { return contestant; }
    public Integer getEliminatedEpisode() { return eliminatedEpisode; }
    public Integer getFinishPlace() { return finishPlace; }
    public boolean isWinner() { return winner; }
}
