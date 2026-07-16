-- Checkpoint 3: Between ep 7 and ep 8, merge window open.
-- Eliminations: Brandon(1) Natalie(2) Danny(3) Priya(4) Marcus(5) Kevin(6) Rachel(7/merge)
-- Scores entered for episodes 2–7.
-- Merge initiated. Alex and Jordan have made their merge moves; Sam and Casey have not.
--   Alex:   SWAP Tyler  → Noah
--   Jordan: SWAP Aisha  → Tyler
-- Run: ./seed.sh 3

-- ─── Variables ────────────────────────────────────────────────────────────────

SET @lid = (SELECT id FROM leagues WHERE code = 'SURV51');

SET @uid_alex   = (SELECT id FROM users WHERE username = 'alex');
SET @uid_jordan = (SELECT id FROM users WHERE username = 'jordan');
SET @uid_sam    = (SELECT id FROM users WHERE username = 'sam');
SET @uid_casey  = (SELECT id FROM users WHERE username = 'casey');

SET @c_maya    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Maya');
SET @c_tyler   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Tyler');
SET @c_priya   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Priya');
SET @c_danny   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Danny');
SET @c_sofia   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Sofia');
SET @c_marcus  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Marcus');
SET @c_rachel  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Rachel');
SET @c_kevin   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Kevin');
SET @c_aisha   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Aisha');
SET @c_jake    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Jake');
SET @c_elena   = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Elena');
SET @c_noah    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Noah');
SET @c_zoe     = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Zoe');
SET @c_carlos  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Carlos');
SET @c_hannah  = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Hannah');
SET @c_brandon = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Brandon');
SET @c_natalie = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Natalie');
SET @c_drew    = (SELECT id FROM contestants WHERE league_id = @lid AND first_name = 'Drew');

-- ─── Reset league state ───────────────────────────────────────────────────────

DELETE FROM merge_actions WHERE league_id = @lid;
DELETE es FROM episode_scores es JOIN contestants c ON es.contestant_id = c.id WHERE c.league_id = @lid;
DELETE FROM episodes WHERE league_id = @lid;
DELETE rp FROM roster_picks   rp JOIN rosters     r ON rp.roster_id     = r.id WHERE r.league_id = @lid;
DELETE FROM rosters WHERE league_id = @lid;
UPDATE contestants SET eliminated_episode = NULL, winner = FALSE WHERE league_id = @lid;

-- ─── League state (merge episode flagged, merge picks open) ───────────────────

UPDATE leagues
SET initial_picks_open = FALSE, merge_picks_open = TRUE
WHERE id = @lid;

INSERT INTO episodes (league_id, episode_number, is_merge_episode) VALUES
(@lid, 1, FALSE), (@lid, 2, FALSE), (@lid, 3, FALSE), (@lid, 4, FALSE),
(@lid, 5, FALSE), (@lid, 6, FALSE), (@lid, 7, TRUE);

UPDATE contestants SET eliminated_episode = 1 WHERE id = @c_brandon;
UPDATE contestants SET eliminated_episode = 2 WHERE id = @c_natalie;
UPDATE contestants SET eliminated_episode = 3 WHERE id = @c_danny;
UPDATE contestants SET eliminated_episode = 4 WHERE id = @c_priya;
UPDATE contestants SET eliminated_episode = 5 WHERE id = @c_marcus;
UPDATE contestants SET eliminated_episode = 6 WHERE id = @c_kevin;
UPDATE contestants SET eliminated_episode = 7 WHERE id = @c_rachel;

-- ─── Rosters (original picks; merge actions adjust effective roster below) ────

INSERT INTO rosters (league_id, user_id, mvp_contestant_id, submitted_at) VALUES
(@lid, @uid_alex,   @c_maya,  '2026-05-28 10:00:00'),
(@lid, @uid_jordan, @c_jake,  '2026-05-28 12:30:00'),
(@lid, @uid_sam,    @c_elena, '2026-05-28 18:45:00'),
(@lid, @uid_casey,  @c_priya, '2026-05-28 22:00:00');

SET @rid_alex   = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_alex);
SET @rid_jordan = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_jordan);
SET @rid_sam    = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_sam);
SET @rid_casey  = (SELECT id FROM rosters WHERE league_id = @lid AND user_id = @uid_casey);

-- alex: Tyler replaced by Noah (merge action below)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_alex, @c_maya), (@rid_alex, @c_rachel), (@rid_alex, @c_kevin),
(@rid_alex, @c_zoe), (@rid_alex, @c_carlos), (@rid_alex, @c_noah);

-- jordan: Aisha replaced by Tyler (merge action below)
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_jordan, @c_priya), (@rid_jordan, @c_danny),
(@rid_jordan, @c_jake), (@rid_jordan, @c_hannah), (@rid_jordan, @c_brandon),
(@rid_jordan, @c_tyler);

-- sam: no merge action yet — original picks
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_sam, @c_sofia), (@rid_sam, @c_marcus),
(@rid_sam, @c_elena), (@rid_sam, @c_noah),
(@rid_sam, @c_natalie), (@rid_sam, @c_drew);

-- casey: no merge action yet — original picks
INSERT INTO roster_picks (roster_id, contestant_id) VALUES
(@rid_casey, @c_maya), (@rid_casey, @c_priya),
(@rid_casey, @c_kevin), (@rid_casey, @c_aisha),
(@rid_casey, @c_carlos), (@rid_casey, @c_hannah);

-- ─── Merge actions ────────────────────────────────────────────────────────────

INSERT INTO merge_actions (league_id, user_id, action_type, added_contestant_id, removed_contestant_id) VALUES
(@lid, @uid_alex,   'SWAP', @c_noah,  @c_tyler),
(@lid, @uid_jordan, 'SWAP', @c_tyler, @c_aisha);

-- ─── Episode scores (eps 2–7) ─────────────────────────────────────────────────

INSERT INTO episode_scores (contestant_id, episode_number, points) VALUES
-- Ep 2
(@c_maya,    2,  8), (@c_tyler,   2,  4), (@c_priya,   2,  3), (@c_danny,   2,  2),
(@c_sofia,   2,  5), (@c_marcus,  2,  6), (@c_rachel,  2,  9), (@c_kevin,   2,  3),
(@c_aisha,   2,  7), (@c_jake,    2, 10), (@c_elena,   2,  8), (@c_noah,    2,  4),
(@c_zoe,     2,  6), (@c_carlos,  2,  5), (@c_hannah,  2,  7), (@c_natalie, 2,  2),
(@c_drew,    2,  6),
-- Ep 3
(@c_maya,    3,  7), (@c_tyler,   3,  5), (@c_priya,   3,  4), (@c_danny,   3,  3),
(@c_sofia,   3,  6), (@c_marcus,  3,  5), (@c_rachel,  3,  8), (@c_kevin,   3,  4),
(@c_aisha,   3,  6), (@c_jake,    3,  8), (@c_elena,   3,  9), (@c_noah,    3,  5),
(@c_zoe,     3,  7), (@c_carlos,  3,  6), (@c_hannah,  3,  5), (@c_drew,    3,  7),
-- Ep 4
(@c_maya,    4,  9), (@c_tyler,   4,  4), (@c_priya,   4,  2),
(@c_sofia,   4,  5), (@c_marcus,  4,  4), (@c_rachel,  4,  7), (@c_kevin,   4,  5),
(@c_aisha,   4,  8), (@c_jake,    4,  9), (@c_elena,   4,  7), (@c_noah,    4,  6),
(@c_zoe,     4,  5), (@c_carlos,  4,  7), (@c_hannah,  4,  8), (@c_drew,    4,  5),
-- Ep 5 (Priya eliminated ep 4)
(@c_maya,    5,  8), (@c_tyler,   5,  6),
(@c_sofia,   5,  4), (@c_marcus,  5,  3), (@c_rachel,  5,  9), (@c_kevin,   5,  6),
(@c_aisha,   5,  7), (@c_jake,    5, 10), (@c_elena,   5,  8), (@c_noah,    5,  5),
(@c_zoe,     5,  6), (@c_carlos,  5,  8), (@c_hannah,  5,  7), (@c_drew,    5,  6),
-- Ep 6 (Marcus eliminated ep 5)
(@c_maya,    6, 10), (@c_tyler,   6,  5),
(@c_sofia,   6,  6), (@c_rachel,  6,  8), (@c_kevin,   6,  4),
(@c_aisha,   6,  9), (@c_jake,    6,  7), (@c_elena,   6,  9), (@c_noah,    6,  7),
(@c_zoe,     6,  8), (@c_carlos,  6,  6), (@c_hannah,  6,  6), (@c_drew,    6,  8),
-- Ep 7 / merge (Kevin eliminated ep 6)
(@c_maya,    7,  9), (@c_tyler,   7,  7),
(@c_sofia,   7,  5), (@c_rachel,  7,  3),
(@c_aisha,   7,  8), (@c_jake,    7,  9), (@c_elena,   7, 10), (@c_noah,    7,  6),
(@c_zoe,     7,  9), (@c_carlos,  7,  7), (@c_hannah,  7,  8), (@c_drew,    7,  7);
