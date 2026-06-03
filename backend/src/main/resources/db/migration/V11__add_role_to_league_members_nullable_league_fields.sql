ALTER TABLE leagues
    MODIFY COLUMN pick_deadline DATETIME NULL,
    MODIFY COLUMN merge_episode INT NULL;

ALTER TABLE league_members
    ADD COLUMN role ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER';

ALTER TABLE leagues
    DROP COLUMN mvp_bonus;