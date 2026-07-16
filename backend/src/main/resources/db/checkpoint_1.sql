-- Checkpoint 1: League created, pick deadline in future, no rosters submitted yet.
-- Run: ./seed.sh 1

-- ─── Variables ────────────────────────────────────────────────────────────────

SET @sid = (SELECT id FROM seasons WHERE season_number = 51);

SET @cid_maya    = (SELECT id FROM contestants WHERE first_name = 'Maya'    AND last_name = 'Chen');
SET @cid_tyler   = (SELECT id FROM contestants WHERE first_name = 'Tyler'   AND last_name = 'Brooks');
SET @cid_priya   = (SELECT id FROM contestants WHERE first_name = 'Priya'   AND last_name = 'Patel');
SET @cid_danny   = (SELECT id FROM contestants WHERE first_name = 'Danny'   AND last_name = 'Kim');
SET @cid_sofia   = (SELECT id FROM contestants WHERE first_name = 'Sofia'   AND last_name = 'Martinez');
SET @cid_marcus  = (SELECT id FROM contestants WHERE first_name = 'Marcus'  AND last_name = 'Johnson');
SET @cid_rachel  = (SELECT id FROM contestants WHERE first_name = 'Rachel'  AND last_name = 'Thompson');
SET @cid_kevin   = (SELECT id FROM contestants WHERE first_name = 'Kevin'   AND last_name = 'Walsh');
SET @cid_aisha   = (SELECT id FROM contestants WHERE first_name = 'Aisha'   AND last_name = 'Washington');
SET @cid_jake    = (SELECT id FROM contestants WHERE first_name = 'Jake'    AND last_name = 'Morrison');
SET @cid_elena   = (SELECT id FROM contestants WHERE first_name = 'Elena'   AND last_name = 'Rivera');
SET @cid_noah    = (SELECT id FROM contestants WHERE first_name = 'Noah'    AND last_name = 'Bennett');
SET @cid_zoe     = (SELECT id FROM contestants WHERE first_name = 'Zoe'     AND last_name = 'Clarke');
SET @cid_carlos  = (SELECT id FROM contestants WHERE first_name = 'Carlos'  AND last_name = 'Reyes');
SET @cid_hannah  = (SELECT id FROM contestants WHERE first_name = 'Hannah'  AND last_name = 'Lee');
SET @cid_brandon = (SELECT id FROM contestants WHERE first_name = 'Brandon' AND last_name = 'Scott');
SET @cid_natalie = (SELECT id FROM contestants WHERE first_name = 'Natalie' AND last_name = 'Adams');
SET @cid_drew    = (SELECT id FROM contestants WHERE first_name = 'Drew'    AND last_name = 'Parker');

-- ─── Cleanup ──────────────────────────────────────────────────────────────────

DELETE ma FROM merge_actions ma JOIN leagues l ON ma.league_id = l.id WHERE l.season_id = @sid;
DELETE es FROM episode_scores  es JOIN leagues l ON es.league_id = l.id WHERE l.season_id = @sid;
DELETE rp FROM roster_picks    rp JOIN rosters  r ON rp.roster_id = r.id JOIN leagues l ON r.league_id = l.id WHERE l.season_id = @sid;
DELETE r  FROM rosters          r JOIN leagues  l ON  r.league_id = l.id WHERE l.season_id = @sid;
DELETE lm FROM league_members  lm JOIN leagues  l ON lm.league_id = l.id WHERE l.season_id = @sid;
DELETE FROM leagues WHERE season_id = @sid;
DELETE FROM users   WHERE username IN ('alex', 'jordan', 'sam', 'casey');
DELETE FROM SPRING_SESSION_ATTRIBUTES;
DELETE FROM SPRING_SESSION;

UPDATE season_contestants SET eliminated_episode = NULL, finish_place = NULL, winner = FALSE WHERE season_id = @sid;
UPDATE seasons SET status = 'UPCOMING', winner_contestant_id = NULL WHERE id = @sid;

-- ─── Season state ─────────────────────────────────────────────────────────────

UPDATE seasons SET status = 'ACTIVE' WHERE id = @sid;

-- ─── Users (password: "password") ─────────────────────────────────────────────

INSERT INTO users (username, password_hash) VALUES
('alex',   '$2b$10$cVQc4XpQmf9OZ6aZ1NBvi.0hBy0BbsBL01QUqEPO8tUx/.ZwAZPNK'),
('jordan', '$2b$10$HQgVmAe6pvRoqGFhmEL1MuNdQnTK08U4khsM72v/VVpnXWwV5OCl6'),
('sam',    '$2b$10$l4OrCgQWYT/4B4tfGnoQqegoa0a8d.b7HQ8KpcmtdpXzAQRmSHx8e'),
('casey',  '$2b$10$NRYKi8nMQOdxvNMlrEF0XeSL4u9.RM/IdFHE3NkeI5kEaUCFikpTW');

SET @uid_alex   = (SELECT id FROM users WHERE username = 'alex');
SET @uid_jordan = (SELECT id FROM users WHERE username = 'jordan');
SET @uid_sam    = (SELECT id FROM users WHERE username = 'sam');
SET @uid_casey  = (SELECT id FROM users WHERE username = 'casey');

-- ─── League (pick deadline in the future — picks still open) ──────────────────

INSERT INTO leagues (name, code, season_id, pick_deadline, merge_episode, merge_deadline, current_episode, contestants_per_tribe, created_by)
VALUES ('Season 51 League', 'SURV51', @sid, '2026-12-31 23:59:59', NULL, NULL, 1, 2, @uid_alex);

SET @lid = LAST_INSERT_ID();

INSERT INTO league_members (league_id, user_id, role) VALUES
(@lid, @uid_alex,   'ADMIN'),
(@lid, @uid_jordan, 'MEMBER'),
(@lid, @uid_sam,    'MEMBER'),
(@lid, @uid_casey,  'MEMBER');

-- No rosters, no episode scores.
