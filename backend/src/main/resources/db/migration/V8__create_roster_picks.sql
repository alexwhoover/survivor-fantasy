CREATE TABLE roster_picks (
    id                   BIGINT NOT NULL AUTO_INCREMENT,
    roster_id            BIGINT NOT NULL,
    season_contestant_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roster_pick (roster_id, season_contestant_id),
    CONSTRAINT fk_rp_roster      FOREIGN KEY (roster_id)            REFERENCES rosters(id),
    CONSTRAINT fk_rp_contestant  FOREIGN KEY (season_contestant_id) REFERENCES season_contestants(id)
);
