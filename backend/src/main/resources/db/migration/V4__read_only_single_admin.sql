-- The app becomes read-only for visitors, with a single site admin who enters all
-- data. That removes three concepts from the schema at once:
--
--   1. Accounts. A `users` row is now just a player — a name on the leaderboard that
--      rosters and scores hang off. Nobody logs in as one; the only credential is the
--      site admin's, which comes from APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD and is
--      never stored here. So password_hash goes, and with it league_members.role
--      (no player is an admin) and leagues.created_by (no account owns a league).
--
--   2. Joining. Leagues are global — every visitor sees every league — so the invite
--      code that `POST /leagues/join` looked up has no remaining reader.
--
--   3. Picking windows. Rosters and merge moves are entered by the admin, who was
--      always exempt from these flags, so there is no longer anything to gate.

ALTER TABLE users DROP COLUMN password_hash;

ALTER TABLE league_members DROP COLUMN role;

-- created_by's foreign key has to go first; MySQL won't drop a column an FK covers.
ALTER TABLE leagues
    DROP FOREIGN KEY fk_league_creator,
    DROP COLUMN created_by,
    DROP INDEX uq_league_code,
    DROP COLUMN code,
    DROP COLUMN initial_picks_open,
    DROP COLUMN merge_picks_open;
