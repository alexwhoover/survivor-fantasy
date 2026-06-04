CREATE TABLE merge_actions (
    id                           BIGINT    NOT NULL AUTO_INCREMENT,
    league_id                    BIGINT    NOT NULL,
    user_id                      BIGINT    NOT NULL,
    action_type                  ENUM('ADD', 'SWAP') NOT NULL,
    added_season_contestant_id   BIGINT    NOT NULL,
    removed_season_contestant_id BIGINT    NULL,
    performed_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_merge_action_per_user (league_id, user_id),
    CONSTRAINT fk_ma_league  FOREIGN KEY (league_id)                    REFERENCES leagues(id),
    CONSTRAINT fk_ma_added   FOREIGN KEY (added_season_contestant_id)   REFERENCES season_contestants(id),
    CONSTRAINT fk_ma_removed FOREIGN KEY (removed_season_contestant_id) REFERENCES season_contestants(id)
);
