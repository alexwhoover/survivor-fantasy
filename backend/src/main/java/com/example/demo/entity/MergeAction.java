package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merge_actions")
public class MergeAction {

    public enum ActionType { ADD, SWAP, NONE }

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

    @Column(name = "added_contestant_id")
    private Long addedContestantId;

    @Column(name = "removed_contestant_id")
    private Long removedContestantId;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    public MergeAction() {}

    public MergeAction(Long leagueId, Long userId, ActionType actionType,
                       Long addedContestantId, Long removedContestantId) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.actionType = actionType;
        this.addedContestantId = addedContestantId;
        this.removedContestantId = removedContestantId;
        this.performedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public ActionType getActionType() { return actionType; }
    public Long getAddedContestantId() { return addedContestantId; }
    public Long getRemovedContestantId() { return removedContestantId; }
    public LocalDateTime getPerformedAt() { return performedAt; }
}
