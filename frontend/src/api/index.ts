export interface EpisodeScoreItem {
  contestantId: number;
  points: number;
}

export interface Tribe {
  id: number;
  name: string;
  colour: string;
}

export interface Contestant {
  id: number;
  firstName: string;
  lastName: string;
  tribeId: number | null;
  tribe: string | null;
  tribeColour: string | null;
  eliminatedEpisode: number | null;
  winner: boolean;
  imageUrl: string | null;
}

export interface LeagueCast {
  /** In the league's own order. */
  tribes: Tribe[];
  contestants: Contestant[];
}

export interface LeagueApiResponse {
  id: number;
  name: string;
  seasonName: string;
  createdAt: string;
  contestantsPerTribe: number;
  /** Number of the episode flagged as the merge, or null before one is flagged. */
  mergeEpisode: number | null;
  archived: boolean;
}

export interface Episode {
  id: number;
  episodeNumber: number;
  isMergeEpisode: boolean;
}

export interface TribeSetupItem {
  name: string;
  colour: string;
}

export interface ContestantSetupItem {
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  tribeIndex: number;
}

/** A player in a league — a name the admin entered, not an account. */
export interface Player {
  userId: number;
  username: string;
  joinedAt: string;
}

export interface RosterResponse {
  userId: number;
  mvpContestantId: number;
  contestantIds: number[];
  /** Null until this player has been assigned their merge move. */
  mergeAction: MergeActionResponse | null;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  /** What each castaway on the roster contributed to totalScore, merge-boundary aware. Keyed by contestant id. */
  contestantPoints: Record<number, number>;
}

export interface EpisodePoint {
  episodeNumber: number;
  cumulativeScore: number;
}

export interface LeaderboardHistoryEntry {
  userId: number;
  username: string;
  history: EpisodePoint[];
}

/**
 * Headline stats for the latest scored episode. Before episode 2 there's no previous week to
 * compare against, so `episodeMvp` is null and `biggestMovers` is empty. Ties list everyone.
 */
export interface LeagueStats {
  episodeNumber: number;
  /** Null when nobody scored above zero. Points exclude the MVP bonus. */
  episodeMvp: { usernames: string[]; points: number } | null;
  /** Empty when nobody climbed. Ranks are shared on ties (1, 1, 3). */
  biggestMovers: { username: string; fromRank: number; toRank: number }[];
}

export interface ScoringGridRow {
  contestantId: number;
  firstName: string;
  lastName: string;
  tribe: string | null;
  tribeColour: string | null;
  eliminatedEpisode: number | null;
  winner: boolean;
  /** One entry per episode, in order from episode 1; null where no score was entered. */
  points: (number | null)[];
  total: number;
}

export interface ScoringGridResponse {
  episodeCount: number;
  mergeEpisode: number | null;
  /** Highest single-episode score in the league — the top of the grid's colour scale. */
  maxPoints: number;
  rows: ScoringGridRow[];
}

export interface MergeActionResponse {
  actionType: "ADD" | "SWAP" | "NONE";
  addedContestantId: number | null;
  removedContestantId: number | null;
}

const API_BASE = "/api";

/**
 * Extracts a human-readable message from a failed response. The backend's error
 * body is JSON (e.g. {"status":400,"error":"Bad Request","message":"..."}), not
 * plain text — falling back to res.text() would print that raw JSON to the user.
 */
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Body wasn't JSON (or was empty) — fall through to the generic message.
  }
  return fallback;
}

/**
 * Every read below is public, so requests still send credentials but a 401 is never
 * surprising — it just means an admin-only call was made without a session, which
 * the caller surfaces locally. Reads never 401 at all.
 */
async function get<T>(path: string, failure: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(await extractErrorMessage(res, failure));
  return res.json();
}

/**
 * `byStatus` names the few outcomes worth their own wording. It isn't belt-and-braces:
 * this Spring Boot version leaves `message` out of the error body, so a status is often
 * the only thing distinguishing one failure from another.
 */
async function write<T>(
  method: string,
  path: string,
  body: unknown,
  failure: string,
  byStatus: Record<number, string> = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const known = res.status === 401 ? "Your admin session expired — sign in again." : byStatus[res.status];
    throw new Error(known ?? (await extractErrorMessage(res, failure)));
  }
  // 204 responses have no body to parse.
  return res.status === 204 ? (undefined as T) : res.json();
}

// --- Admin session ---
// The app's only authentication. Players never sign in, so this exists purely so the
// admin can unlock the editing UI; the server session is the sole source of truth.

/** Resolves true if the caller holds a valid admin session. */
export async function isAdminSignedIn(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/session`, { credentials: "include" });
  return res.ok;
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Incorrect username or password" : await extractErrorMessage(res, "Sign-in failed"));
  }
}

export async function adminLogout(): Promise<void> {
  await fetch(`${API_BASE}/admin/logout`, { method: "POST", credentials: "include" });
}

// --- Leagues ---
// Leagues are global: every visitor sees every league.

export function getLeagues(): Promise<LeagueApiResponse[]> {
  return get("/leagues", "Failed to load leagues");
}

export function getLeagueById(id: number): Promise<LeagueApiResponse> {
  return get(`/leagues/${id}`, "Failed to load league");
}

/**
 * Creates a fully configured league in one atomic step — the league itself, its
 * tribes, and its contestants. This is the only way a league's season data is
 * ever created; there is no separate season-setup step afterward.
 */
export function createLeague(
  name: string,
  seasonName: string,
  contestantsPerTribe: number,
  tribes: TribeSetupItem[],
  contestants: ContestantSetupItem[],
): Promise<LeagueApiResponse> {
  return write("POST", "/leagues", { name, seasonName, contestantsPerTribe, tribes, contestants },
    "Failed to create league");
}

export function setLeagueArchived(leagueId: number, archived: boolean): Promise<LeagueApiResponse> {
  return write("PUT", `/leagues/${leagueId}/archived`, { archived }, "Failed to update archived state");
}

// --- Players ---

export function getPlayers(leagueId: number): Promise<Player[]> {
  return get(`/leagues/${leagueId}/players`, "Failed to load players");
}

export function addPlayer(leagueId: number, name: string): Promise<Player[]> {
  return write("POST", `/leagues/${leagueId}/players`, { name }, "Failed to add player", {
    409: "That player is already in this league.",
  });
}

export function removePlayer(leagueId: number, playerId: number): Promise<Player[]> {
  return write("DELETE", `/leagues/${leagueId}/players/${playerId}`, undefined, "Failed to remove player");
}

// --- Season configuration (tribes + contestants, owned by the league) ---
// Tribe and contestant identity is fixed by the creation wizard; the only
// ongoing mutation is tracking a contestant's elimination/winner status.

export function getLeagueCast(leagueId: number): Promise<LeagueCast> {
  return get(`/leagues/${leagueId}/cast`, "Failed to load cast");
}

export function updateContestantStatus(
  leagueId: number,
  contestantId: number,
  eliminatedEpisode: number | null,
  winner: boolean,
): Promise<Contestant> {
  return write("PUT", `/leagues/${leagueId}/contestants/${contestantId}/status`,
    { eliminatedEpisode, winner }, "Failed to update contestant status");
}

// --- Episodes ---
// Episodes are created manually by the admin as the season progresses.

export function getEpisodes(leagueId: number): Promise<Episode[]> {
  return get(`/leagues/${leagueId}/episodes`, "Failed to load episodes");
}

export function addEpisode(leagueId: number): Promise<Episode> {
  return write("POST", `/leagues/${leagueId}/episodes`, {}, "Failed to add episode");
}

export function deleteEpisode(leagueId: number, episodeId: number): Promise<void> {
  return write("DELETE", `/leagues/${leagueId}/episodes/${episodeId}`, undefined, "Failed to remove episode");
}

/** Flags (or unflags) an episode as the season's merge episode. At most one may be flagged. */
export function setEpisodeMergeFlag(
  leagueId: number,
  episodeId: number,
  isMergeEpisode: boolean,
): Promise<Episode> {
  return write("PUT", `/leagues/${leagueId}/episodes/${episodeId}/merge-flag`,
    { isMergeEpisode }, "Failed to update merge episode flag");
}

// --- Rosters ---

export function getAllRosters(leagueId: number): Promise<RosterResponse[]> {
  return get(`/leagues/${leagueId}/rosters`, "Failed to load rosters");
}

/** Sets a player's picks, creating their roster if they didn't have one. */
export function setRoster(
  leagueId: number,
  playerId: number,
  contestantIds: number[],
  mvpContestantId: number,
): Promise<RosterResponse> {
  return write("PUT", `/leagues/${leagueId}/rosters/${playerId}`,
    { contestantIds, mvpContestantId }, "Failed to save roster");
}

// --- Episode scores ---

export function getEpisodeScores(leagueId: number, episodeNumber: number): Promise<EpisodeScoreItem[]> {
  return get(`/leagues/${leagueId}/episodes/${episodeNumber}/scores`, "Failed to load scores");
}

export function saveEpisodeScores(
  leagueId: number,
  episodeNumber: number,
  scores: EpisodeScoreItem[],
): Promise<EpisodeScoreItem[]> {
  return write("POST", `/leagues/${leagueId}/episodes/${episodeNumber}/scores`, scores, "Failed to save scores");
}

// --- Standings ---

export function getLeaderboard(leagueId: number): Promise<LeaderboardEntry[]> {
  return get(`/leagues/${leagueId}/leaderboard`, "Failed to load leaderboard");
}

export function getLeaderboardHistory(leagueId: number): Promise<LeaderboardHistoryEntry[]> {
  return get(`/leagues/${leagueId}/leaderboard/history`, "Failed to load leaderboard history");
}

export function getLeagueStats(leagueId: number): Promise<LeagueStats> {
  return get(`/leagues/${leagueId}/leaderboard/stats`, "Failed to load league stats");
}

export function getScoringGrid(leagueId: number): Promise<ScoringGridResponse> {
  return get(`/leagues/${leagueId}/scoring-grid`, "Failed to load scoring grid");
}

// --- Merge ---

/** Sets (or corrects) a player's post-merge move. */
export function setMergeAction(
  leagueId: number,
  playerId: number,
  addedContestantId: number | null,
  removedContestantId: number | null,
  noChange: boolean = false,
): Promise<RosterResponse> {
  return write("PUT", `/leagues/${leagueId}/merge/action/${playerId}`,
    { addedContestantId, removedContestantId, noChange }, "Failed to set merge action");
}
