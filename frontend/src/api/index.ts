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
  totalPoints: number;
}

export interface AuthUser {
  id: number;
  username: string;
  createdAt: string;
}

export interface LeagueApiResponse {
  id: number;
  name: string;
  code: string;
  seasonName: string;
  createdBy: number;
  createdAt: string;
  contestantsPerTribe: number;
  initialPicksOpen: boolean;
  mergePicksOpen: boolean;
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

export interface LeagueMember {
  userId: number;
  username: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface RosterResponse {
  id: number;
  leagueId: number;
  userId: number;
  mvpContestantId: number;
  contestantIds: number[];
  submittedAt: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  mvpBonusApplied: boolean;
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

export interface MergeMemberStatus {
  userId: number;
  username: string;
  hasActed: boolean;
}

export interface MergeStatusResponse {
  initiated: boolean;
  mergeEpisode: number | null;
  mergePicksOpen: boolean;
  memberStatuses: MergeMemberStatus[];
}

export interface MergeActionResponse {
  actionType: "ADD" | "SWAP" | "NONE";
  addedContestantId: number | null;
  removedContestantId: number | null;
}

const API_BASE = "/api";

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }
  return res;
}

// --- Auth ---
// The server session (a cookie validated on every request) is the sole source
// of truth for auth state — nothing is cached client-side across page loads.

/** Validates the current session against the server. Resolves null if it's missing, expired, or invalid. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await apiFetch(`${API_BASE}/users/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Invalid credentials");
  }
  return res.json();
}

export async function register(username: string, password: string, inviteCode: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, inviteCode }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/users/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// --- Leagues ---

export async function getMyLeagues(userId: number): Promise<LeagueApiResponse[]> {
  const res = await apiFetch(`${API_BASE}/leagues?userId=${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch leagues: ${res.status}`);
  return res.json();
}

export async function getLeagueById(id: number): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch league: ${res.status}`);
  return res.json();
}

/**
 * Creates a fully configured league in one atomic step — the league itself, its
 * tribes, and its contestants. This is the only way a league's season data is
 * ever created; there is no separate season-setup step afterward.
 */
export async function createLeague(
  name: string,
  seasonName: string,
  userId: number,
  contestantsPerTribe: number,
  tribes: TribeSetupItem[],
  contestants: ContestantSetupItem[]
): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, seasonName, userId, contestantsPerTribe, tribes, contestants }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create league");
  }
  return res.json();
}

export async function setInitialPicksOpen(leagueId: number, adminUserId: number, open: boolean): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/initial-picking`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, open }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update initial picking state");
  }
  return res.json();
}

export async function setMergePicksOpen(leagueId: number, adminUserId: number, open: boolean): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/merge-picking`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, open }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update merge picking state");
  }
  return res.json();
}

export async function setLeagueArchived(leagueId: number, adminUserId: number, archived: boolean): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/archived`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, archived }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update archived state");
  }
  return res.json();
}

export async function joinLeague(code: string, userId: number): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/join`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, userId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to join league");
  }
  return res.json();
}

export async function getLeagueMembers(leagueId: number): Promise<LeagueMember[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/members`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
  return res.json();
}

export async function getMyLeagueRole(leagueId: number, userId: number): Promise<"ADMIN" | "MEMBER" | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/my-role?userId=${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch role: ${res.status}`);
  const data = await res.json();
  return data.role;
}

// --- Season configuration (tribes + contestants, owned by the league) ---
// Tribe and contestant identity is fixed by the creation wizard; the only
// ongoing mutation is tracking a contestant's elimination/winner status.

export async function getLeagueTribes(leagueId: number): Promise<Tribe[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/tribes`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch tribes: ${res.status}`);
  return res.json();
}

export async function getLeagueContestants(leagueId: number): Promise<Contestant[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/contestants`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch contestants: ${res.status}`);
  return res.json();
}

export async function updateContestantStatus(
  leagueId: number,
  adminUserId: number,
  contestantId: number,
  eliminatedEpisode: number | null,
  winner: boolean
): Promise<Contestant> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/contestants/${contestantId}/status`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, eliminatedEpisode, winner }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update contestant status");
  }
  return res.json();
}

// --- Episodes ---
// Episodes are created manually by the admin as the season progresses.

export async function getEpisodes(leagueId: number): Promise<Episode[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.status}`);
  return res.json();
}

export async function addEpisode(leagueId: number, adminUserId: number): Promise<Episode> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to add episode");
  }
  return res.json();
}

export async function deleteEpisode(leagueId: number, adminUserId: number, episodeId: number): Promise<void> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes/${episodeId}?adminUserId=${adminUserId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to remove episode");
  }
}

/** Flags (or unflags) an episode as the season's merge episode. At most one may be flagged. */
export async function setEpisodeMergeFlag(
  leagueId: number,
  adminUserId: number,
  episodeId: number,
  isMergeEpisode: boolean
): Promise<Episode> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes/${episodeId}/merge-flag`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, isMergeEpisode }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update merge episode flag");
  }
  return res.json();
}

// --- Rosters ---

export async function getMyRoster(leagueId: number, userId: number): Promise<RosterResponse | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters/me?userId=${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch roster: ${res.status}`);
  return res.json();
}

export async function getRosterForUser(leagueId: number, userId: number): Promise<RosterResponse | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters/${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch roster: ${res.status}`);
  return res.json();
}

export async function getContestantPointsForUser(
  leagueId: number,
  userId: number
): Promise<Record<number, number>> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters/${userId}/contestant-points`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch contestant points: ${res.status}`);
  return res.json();
}

export async function submitRoster(
  leagueId: number,
  userId: number,
  contestantIds: number[],
  mvpContestantId: number
): Promise<RosterResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, contestantIds, mvpContestantId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to submit roster");
  }
  return res.json();
}

export async function adminUpdateRoster(
  leagueId: number,
  adminUserId: number,
  targetUserId: number,
  contestantIds: number[],
  mvpContestantId: number
): Promise<RosterResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters/${targetUserId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: adminUserId, contestantIds, mvpContestantId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update roster");
  }
  return res.json();
}

// --- Episode Scores ---

export async function getEpisodeScores(leagueId: number, episodeNumber: number): Promise<EpisodeScoreItem[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes/${episodeNumber}/scores`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch scores: ${res.status}`);
  return res.json();
}

export async function saveEpisodeScores(
  leagueId: number,
  episodeNumber: number,
  scores: EpisodeScoreItem[]
): Promise<EpisodeScoreItem[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/episodes/${episodeNumber}/scores`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save scores");
  }
  return res.json();
}

// --- Leaderboard ---

export async function getLeaderboard(leagueId: number): Promise<LeaderboardEntry[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/leaderboard`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`);
  return res.json();
}

export async function getLeaderboardHistory(leagueId: number): Promise<LeaderboardHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/leaderboard/history`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch leaderboard history: ${res.status}`);
  return res.json();
}

// --- Merge ---

export async function getMergeStatus(leagueId: number): Promise<MergeStatusResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/merge/status`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch merge status: ${res.status}`);
  return res.json();
}

export async function getAllRosters(leagueId: number): Promise<RosterResponse[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch rosters: ${res.status}`);
  return res.json();
}

export async function adminSetMergeAction(
  leagueId: number,
  adminUserId: number,
  targetUserId: number,
  addedContestantId: number | null,
  removedContestantId: number | null,
  noChange: boolean = false
): Promise<MergeStatusResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/merge/action/${targetUserId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminUserId, addedContestantId, removedContestantId, noChange }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to set merge action");
  }
  return res.json();
}

export async function getMyMergeAction(leagueId: number, userId: number): Promise<MergeActionResponse | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/merge/action/me?userId=${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch merge action: ${res.status}`);
  return res.json();
}

export async function performMergeAction(
  leagueId: number,
  userId: number,
  addedContestantId: number | null,
  removedContestantId: number | null,
  noChange = false
): Promise<MergeStatusResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/merge/action`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, addedContestantId, removedContestantId, noChange }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to perform merge action");
  }
  return res.json();
}
