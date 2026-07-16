-- Checkpoint 3: Between ep 7 and ep 8, merge window open.
-- Eliminations: Brandon(1) Natalie(2) Danny(3) Priya(4) Marcus(5) Kevin(6) Rachel(7/merge)
-- Scores entered for episodes 2–7.
-- Merge initiated. Alex and Jordan have made their merge moves; Sam and Casey have not.
--   Alex:   SWAP Tyler  → Noah
--   Jordan: SWAP Aisha  → Tyler
-- Run: ./seed.sh 3

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

SET @sc_maya    = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_maya);
SET @sc_tyler   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_tyler);
SET @sc_priya   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_priya);
SET @sc_danny   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_danny);
SET @sc_sofia   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_sofia);
SET @sc_marcus  = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_marcus);
SET @sc_rachel  = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_rachel);
SET @sc_kevin   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_kevin);
SET @sc_aisha   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_aisha);
SET @sc_jake    = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_jake);
SET @sc_elena   = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_elena);
SET @sc_noah    = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_noah);
SET @sc_zoe     = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_zoe);
SET @sc_carlos  = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_carlos);
SET @sc_hannah  = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_hannah);
SET @sc_brandon = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_brandon);
SET @sc_natalie = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_natalie);
SET @sc_drew    = (SELECT id FROM season_contestants WHERE season_id = @sid AND contestant_id = @cid_drew);

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

UPDATE season_contestants SET eliminated_episode = 1, finish_place = 18 WHERE id = @sc_brandon;
UPDATE season_contestants SET eliminated_episode = 2, finish_place = 17 WHERE id = @sc_natalie;
UPDATE season_contestants SET eliminated_episode = 3, finish_place = 16 WHERE id = @sc_danny;
UPDATE season_contestants SET eliminated_episode = 4, finish_place = 15 WHERE id = @sc_priya;
UPDATE season_contestants SET eliminated_episode = 5, finish_place = 14 WHERE id = @sc_marcus;
UPDATE season_contestants SET eliminated_episode = 6, finish_place = 13 WHERE id = @sc_kevin;
UPDATE season_contestants SET eliminated_episode = 7, finish_place = 12 WHERE id = @sc_rachel;

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

-- ─── League (merge initiated, deadline still open) ────────────────────────────

INSERT INTO leagues (name, code, season_id, pick_deadline, merge_episode, merge_deadline, current_episode, contestants_per_tribe, created_by)
VALUES ('Season 51 League', 'SURV51', @sid, '2026-05-30 23:59:59', 7, '2026-11-08 23:59:59', 7, 2, @uid_alex);

SET @lid = LAST_INSERT_ID();

INSERT INTO league_members (league_id, user_id, role) VALUES
(@lid, @uid_alex,   'ADMIN'),
(@lid, @uid_jordan, 'MEMBER'),
(@lid, @uid_sam,    'MEMBER'),
(@lid, @uid_casey,  'MEMBER');

-- ─── Rosters (original picks; merge actions adjust effective roster below) ────

INSERT INTO rosters (league_id, user_id, mvp_season_contestant_id, submitted_at) VALUES
(@lid, @uid_alex,   @sc_maya,  '2026-05-28 10:00:00'),
(@lid, @uid_jordan, @sc_jake,  '2026-05-28 12:30:00'),
(@lid, @uid_sam,    @sc_elena, '2026-05-28 18:45:00'),
(@lid, @uid_casey,  @sc_priya, '2026-05-28 22:00:00');

SET @rid_alex   = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_alex);
SET @rid_jordan = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_jordan);
SET @rid_sam    = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_sam);
SET @rid_casey  = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_casey);

-- alex: Tyler replaced by Noah (merge action below)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_alex, @sc_maya), (@rid_alex, @sc_rachel), (@rid_alex, @sc_kevin),
(@rid_alex, @sc_zoe), (@rid_alex, @sc_carlos), (@rid_alex, @sc_noah);

-- jordan: Aisha replaced by Tyler (merge action below)
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_jordan, @sc_priya), (@rid_jordan, @sc_danny),
(@rid_jordan, @sc_jake), (@rid_jordan, @sc_hannah), (@rid_jordan, @sc_brandon),
(@rid_jordan, @sc_tyler);

-- sam: no merge action yet — original picks
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_sam, @sc_sofia), (@rid_sam, @sc_marcus),
(@rid_sam, @sc_elena), (@rid_sam, @sc_noah),
(@rid_sam, @sc_natalie), (@rid_sam, @sc_drew);

-- casey: no merge action yet — original picks
INSERT INTO roster_picks (roster_id, season_contestant_id) VALUES
(@rid_casey, @sc_maya), (@rid_casey, @sc_priya),
(@rid_casey, @sc_kevin), (@rid_casey, @sc_aisha),
(@rid_casey, @sc_carlos), (@rid_casey, @sc_hannah);

-- ─── Merge actions ────────────────────────────────────────────────────────────

INSERT INTO merge_actions (league_id, user_id, action_type, added_season_contestant_id, removed_season_contestant_id) VALUES
(@lid, @uid_alex,   'SWAP', @sc_noah,  @sc_tyler),
(@lid, @uid_jordan, 'SWAP', @sc_tyler, @sc_aisha);

-- ─── Episode scores (eps 2–7) ─────────────────────────────────────────────────

INSERT INTO episode_scores (season_contestant_id, league_id, episode_number, points) VALUES
-- Ep 2
(@sc_maya,    @lid, 2,  8), (@sc_tyler,   @lid, 2,  4), (@sc_priya,   @lid, 2,  3), (@sc_danny,   @lid, 2,  2),
(@sc_sofia,   @lid, 2,  5), (@sc_marcus,  @lid, 2,  6), (@sc_rachel,  @lid, 2,  9), (@sc_kevin,   @lid, 2,  3),
(@sc_aisha,   @lid, 2,  7), (@sc_jake,    @lid, 2, 10), (@sc_elena,   @lid, 2,  8), (@sc_noah,    @lid, 2,  4),
(@sc_zoe,     @lid, 2,  6), (@sc_carlos,  @lid, 2,  5), (@sc_hannah,  @lid, 2,  7), (@sc_natalie, @lid, 2,  2),
(@sc_drew,    @lid, 2,  6),
-- Ep 3
(@sc_maya,    @lid, 3,  7), (@sc_tyler,   @lid, 3,  5), (@sc_priya,   @lid, 3,  4), (@sc_danny,   @lid, 3,  3),
(@sc_sofia,   @lid, 3,  6), (@sc_marcus,  @lid, 3,  5), (@sc_rachel,  @lid, 3,  8), (@sc_kevin,   @lid, 3,  4),
(@sc_aisha,   @lid, 3,  6), (@sc_jake,    @lid, 3,  8), (@sc_elena,   @lid, 3,  9), (@sc_noah,    @lid, 3,  5),
(@sc_zoe,     @lid, 3,  7), (@sc_carlos,  @lid, 3,  6), (@sc_hannah,  @lid, 3,  5), (@sc_drew,    @lid, 3,  7),
-- Ep 4
(@sc_maya,    @lid, 4,  9), (@sc_tyler,   @lid, 4,  4), (@sc_priya,   @lid, 4,  2),
(@sc_sofia,   @lid, 4,  5), (@sc_marcus,  @lid, 4,  4), (@sc_rachel,  @lid, 4,  7), (@sc_kevin,   @lid, 4,  5),
(@sc_aisha,   @lid, 4,  8), (@sc_jake,    @lid, 4,  9), (@sc_elena,   @lid, 4,  7), (@sc_noah,    @lid, 4,  6),
(@sc_zoe,     @lid, 4,  5), (@sc_carlos,  @lid, 4,  7), (@sc_hannah,  @lid, 4,  8), (@sc_drew,    @lid, 4,  5),
-- Ep 5 (Priya eliminated ep 4)
(@sc_maya,    @lid, 5,  8), (@sc_tyler,   @lid, 5,  6),
(@sc_sofia,   @lid, 5,  4), (@sc_marcus,  @lid, 5,  3), (@sc_rachel,  @lid, 5,  9), (@sc_kevin,   @lid, 5,  6),
(@sc_aisha,   @lid, 5,  7), (@sc_jake,    @lid, 5, 10), (@sc_elena,   @lid, 5,  8), (@sc_noah,    @lid, 5,  5),
(@sc_zoe,     @lid, 5,  6), (@sc_carlos,  @lid, 5,  8), (@sc_hannah,  @lid, 5,  7), (@sc_drew,    @lid, 5,  6),
-- Ep 6 (Marcus eliminated ep 5)
(@sc_maya,    @lid, 6, 10), (@sc_tyler,   @lid, 6,  5),
(@sc_sofia,   @lid, 6,  6), (@sc_rachel,  @lid, 6,  8), (@sc_kevin,   @lid, 6,  4),
(@sc_aisha,   @lid, 6,  9), (@sc_jake,    @lid, 6,  7), (@sc_elena,   @lid, 6,  9), (@sc_noah,    @lid, 6,  7),
(@sc_zoe,     @lid, 6,  8), (@sc_carlos,  @lid, 6,  6), (@sc_hannah,  @lid, 6,  6), (@sc_drew,    @lid, 6,  8),
-- Ep 7 / merge (Kevin eliminated ep 6)
(@sc_maya,    @lid, 7,  9), (@sc_tyler,   @lid, 7,  7),
(@sc_sofia,   @lid, 7,  5), (@sc_rachel,  @lid, 7,  3),
(@sc_aisha,   @lid, 7,  8), (@sc_jake,    @lid, 7,  9), (@sc_elena,   @lid, 7, 10), (@sc_noah,    @lid, 7,  6),
(@sc_zoe,     @lid, 7,  9), (@sc_carlos,  @lid, 7,  7), (@sc_hannah,  @lid, 7,  8), (@sc_drew,    @lid, 7,  7);
