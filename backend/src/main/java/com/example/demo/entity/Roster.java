package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rosters")
public class Roster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "mvp_season_contestant_id")
    private Long mvpSeasonContestantId;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    public Roster() {}

    public Roster(Long leagueId, Long userId, Long mvpSeasonContestantId, LocalDateTime submittedAt) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.mvpSeasonContestantId = mvpSeasonContestantId;
        this.submittedAt = submittedAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public Long getMvpSeasonContestantId() { return mvpSeasonContestantId; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }

    public void setMvpSeasonContestantId(Long mvpSeasonContestantId) { this.mvpSeasonContestantId = mvpSeasonContestantId; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
