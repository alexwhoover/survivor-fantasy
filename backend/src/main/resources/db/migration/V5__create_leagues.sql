CREATE TABLE leagues (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(100) NOT NULL,
    code                  VARCHAR(10)  NOT NULL,
    season_id             BIGINT       NOT NULL,
    pick_deadline         DATETIME     NOT NULL,
    merge_episode         INT          NOT NULL,
    current_episode       INT          DEFAULT 1,
    mvp_bonus             INT          DEFAULT 50,
    contestants_per_tribe INT          DEFAULT 2,
    created_by            BIGINT       NOT NULL,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_league_code (code),
    CONSTRAINT fk_league_season   FOREIGN KEY (season_id)  REFERENCES seasons(id),
    CONSTRAINT fk_league_creator  FOREIGN KEY (created_by) REFERENCES users(id)
);
