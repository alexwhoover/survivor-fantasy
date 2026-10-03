package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Links a player ({@link User}) to a league. The admin creates and removes these. */
@Entity
@Table(name = "league_members")
public class LeagueMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    public LeagueMember() {}

    public LeagueMember(Long leagueId, Long userId, LocalDateTime joinedAt) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.joinedAt = joinedAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
