CREATE TABLE league_members (
    id        BIGINT    NOT NULL AUTO_INCREMENT,
    league_id BIGINT    NOT NULL,
    user_id   BIGINT    NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_league_member (league_id, user_id),
    CONSTRAINT fk_lm_league FOREIGN KEY (league_id) REFERENCES leagues(id),
    CONSTRAINT fk_lm_user   FOREIGN KEY (user_id)   REFERENCES users(id)
);
