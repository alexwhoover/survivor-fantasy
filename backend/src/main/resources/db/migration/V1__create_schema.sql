-- Consolidated schema. Season data (name, tribes, contestants) is owned and
-- managed by each league — there are no globally administered seasons.

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_username (username)
);

CREATE TABLE leagues (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(100) NOT NULL,
    code                  VARCHAR(10)  NOT NULL,
    season_name           VARCHAR(100) NOT NULL,
    initial_picks_open    BOOLEAN      NOT NULL DEFAULT TRUE,
    merge_picks_open      BOOLEAN      NOT NULL DEFAULT FALSE,
    contestants_per_tribe INT          DEFAULT 2,
    created_by            BIGINT       NOT NULL,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_league_code (code),
    CONSTRAINT fk_league_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE league_members (
    id        BIGINT    NOT NULL AUTO_INCREMENT,
    league_id BIGINT    NOT NULL,
    user_id   BIGINT    NOT NULL,
    role      ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_league_member (league_id, user_id),
    CONSTRAINT fk_lm_league FOREIGN KEY (league_id) REFERENCES leagues(id),
    CONSTRAINT fk_lm_user   FOREIGN KEY (user_id)   REFERENCES users(id)
);

CREATE TABLE tribes (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    league_id BIGINT      NOT NULL,
    name      VARCHAR(50) NOT NULL,
    colour    VARCHAR(7)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tribe (league_id, name),
    CONSTRAINT fk_tribe_league FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE contestants (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    league_id          BIGINT       NOT NULL,
    tribe_id           BIGINT       NULL,
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    hometown           VARCHAR(100),
    state              VARCHAR(100),
    image_url          VARCHAR(500),
    eliminated_episode INT          NULL,
    winner             BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_contestant_league FOREIGN KEY (league_id) REFERENCES leagues(id),
    CONSTRAINT fk_contestant_tribe  FOREIGN KEY (tribe_id)  REFERENCES tribes(id)
);

CREATE TABLE rosters (
    id                 BIGINT    NOT NULL AUTO_INCREMENT,
    league_id          BIGINT    NOT NULL,
    user_id            BIGINT    NOT NULL,
    mvp_contestant_id  BIGINT,
    submitted_at       TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roster (league_id, user_id),
    CONSTRAINT fk_roster_league FOREIGN KEY (league_id)         REFERENCES leagues(id),
    CONSTRAINT fk_roster_user   FOREIGN KEY (user_id)           REFERENCES users(id),
    CONSTRAINT fk_roster_mvp    FOREIGN KEY (mvp_contestant_id) REFERENCES contestants(id)
);

CREATE TABLE roster_picks (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    roster_id     BIGINT NOT NULL,
    contestant_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roster_pick (roster_id, contestant_id),
    CONSTRAINT fk_rp_roster     FOREIGN KEY (roster_id)     REFERENCES rosters(id),
    CONSTRAINT fk_rp_contestant FOREIGN KEY (contestant_id) REFERENCES contestants(id)
);

CREATE TABLE episodes (
    id               BIGINT    NOT NULL AUTO_INCREMENT,
    league_id        BIGINT    NOT NULL,
    episode_number   INT       NOT NULL,
    is_merge_episode BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_episode (league_id, episode_number),
    CONSTRAINT fk_episode_league FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE episode_scores (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    contestant_id  BIGINT NOT NULL,
    episode_number INT    NOT NULL,
    points         INT    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_episode_score (contestant_id, episode_number),
    CONSTRAINT fk_es_contestant FOREIGN KEY (contestant_id) REFERENCES contestants(id)
);

CREATE TABLE merge_actions (
    id                    BIGINT    NOT NULL AUTO_INCREMENT,
    league_id             BIGINT    NOT NULL,
    user_id               BIGINT    NOT NULL,
    action_type           ENUM('ADD', 'SWAP', 'NONE') NOT NULL,
    added_contestant_id   BIGINT    NULL,
    removed_contestant_id BIGINT    NULL,
    performed_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_merge_action_per_user (league_id, user_id),
    CONSTRAINT fk_ma_league  FOREIGN KEY (league_id)             REFERENCES leagues(id),
    CONSTRAINT fk_ma_user    FOREIGN KEY (user_id)               REFERENCES users(id),
    CONSTRAINT fk_ma_added   FOREIGN KEY (added_contestant_id)   REFERENCES contestants(id),
    CONSTRAINT fk_ma_removed FOREIGN KEY (removed_contestant_id) REFERENCES contestants(id)
);
