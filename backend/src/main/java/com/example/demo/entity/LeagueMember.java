package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "league_members")
public class LeagueMember {

    public enum Role { ADMIN, MEMBER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "league_id", nullable = false)
    private Long leagueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    public LeagueMember() {}

    public LeagueMember(Long leagueId, Long userId, Role role, LocalDateTime joinedAt) {
        this.leagueId = leagueId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public Long getId() { return id; }
    public Long getLeagueId() { return leagueId; }
    public Long getUserId() { return userId; }
    public Role getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
