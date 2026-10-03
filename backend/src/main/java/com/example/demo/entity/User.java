package com.example.demo.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A player in a league — a name that rosters, merge actions and leaderboard entries
 * hang off. Despite the table name, this is not an account: nobody signs in as a
 * player. The only credential in the app is the site admin's, which lives in the
 * environment (see {@code config.SecurityConfig}), not in this table.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public User() {}

    public User(String username, LocalDateTime createdAt) {
        this.username = username;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
