package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merge_actions")
public class MergeAction {

    public enum ActionType { ADD, SWAP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "added_season_contestant_id", nullable = false)
    private Long addedSeasonContestantId;

    @Column(name = "removed_season_contestant_id")
    private Long removedSeasonContestantId;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    public MergeAction() {}

    public MergeAction(Long leagueId, Long userId, ActionType actionType,
                       Long addedSeasonContestantId, Long removedSeasonContestantId) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.actionType = actionType;
        this.addedSeasonContestantId = addedSeasonContestantId;
        this.removedSeasonContestantId = removedSeasonContestantId;
        this.performedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public ActionType getActionType() { return actionType; }
    public Long getAddedSeasonContestantId() { return addedSeasonContestantId; }
    public Long getRemovedSeasonContestantId() { return removedSeasonContestantId; }
    public LocalDateTime getPerformedAt() { return performedAt; }
}
