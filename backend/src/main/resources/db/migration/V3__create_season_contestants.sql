CREATE TABLE season_contestants (
    id                 BIGINT NOT NULL AUTO_INCREMENT,
    season_id          BIGINT NOT NULL,
    contestant_id      BIGINT NOT NULL,
    tribe              VARCHAR(50),
    eliminated_episode INT,
    finish_place       INT,
    winner             BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_season_contestant (season_id, contestant_id),
    CONSTRAINT fk_sc_season     FOREIGN KEY (season_id)     REFERENCES seasons(id),
    CONSTRAINT fk_sc_contestant FOREIGN KEY (contestant_id) REFERENCES contestants(id)
);

ALTER TABLE seasons
    ADD CONSTRAINT fk_season_winner
    FOREIGN KEY (winner_contestant_id) REFERENCES contestants(id);
