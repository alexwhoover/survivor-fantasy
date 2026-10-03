-- Checkpoint 1: League created, no rosters entered yet.
-- Run: ./seed.sh 1

SET @lid = (SELECT id FROM leagues WHERE name = 'Season 51 League');

-- ─── Reset league state ───────────────────────────────────────────────────────

DELETE FROM merge_actions WHERE league_id = @lid;
DELETE es FROM episode_scores es JOIN contestants c ON es.contestant_id = c.id WHERE c.league_id = @lid;
DELETE FROM episodes WHERE league_id = @lid;
DELETE rp FROM roster_picks   rp JOIN rosters     r ON rp.roster_id     = r.id WHERE r.league_id = @lid;
DELETE FROM rosters WHERE league_id = @lid;
UPDATE contestants SET eliminated_episode = NULL, winner = FALSE WHERE league_id = @lid;

-- No episodes, no rosters, no episode scores.
