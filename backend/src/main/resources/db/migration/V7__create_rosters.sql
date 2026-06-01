CREATE TABLE rosters (
    id                       BIGINT    NOT NULL AUTO_INCREMENT,
    league_id                BIGINT    NOT NULL,
    user_id                  BIGINT    NOT NULL,
    mvp_season_contestant_id BIGINT,
    submitted_at             TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roster (league_id, user_id),
    CONSTRAINT fk_roster_league FOREIGN KEY (league_id)                REFERENCES leagues(id),
    CONSTRAINT fk_roster_user   FOREIGN KEY (user_id)                  REFERENCES users(id),
    CONSTRAINT fk_roster_mvp    FOREIGN KEY (mvp_season_contestant_id) REFERENCES season_contestants(id)
);
