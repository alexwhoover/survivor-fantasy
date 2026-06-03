import type { Contestant, League, UserRoster } from "../app/data/mockData";
import {
  mockContestants,
  mockLeagues,
  myRoster,
  otherRosters,
} from "../app/data/mockData";

export type { Contestant, League, UserRoster };

export interface Season {
  id: number;
  name: string;
  seasonNumber: number;
  location: string | null;
  premiereDate: string | null;
  finaleDate: string | null;
  mergeEpisode: number | null;
  numEpisodes: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  winnerContestantId: number | null;
}

export interface EpisodeScoreItem {
  seasonContestantId: number;
  points: number;
}

export interface SeasonContestant {
  id: number;
  firstName: string;
  lastName: string;
  hometown: string | null;
  state: string | null;
  tribe: string | null;
  tribeColour: string | null;
  finishPlace: number | null;
  eliminatedEpisode: number | null;
  winner: boolean;
  imageUrl: string | null;
}

export interface AuthUser {
  id: number;
  username: string;
  createdAt: string;
}

const API_BASE = "/api";

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }
  return res;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = sessionStorage.getItem("survivor_session");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
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
  const user: AuthUser = await res.json();
  sessionStorage.setItem("survivor_session", JSON.stringify(user));
  return user;
}

export async function register(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }
  const user: AuthUser = await res.json();
  sessionStorage.setItem("survivor_session", JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/users/logout`, {
    method: "POST",
    credentials: "include",
  });
  sessionStorage.removeItem("survivor_session");
}

export interface LeagueApiResponse {
  id: number;
  name: string;
  code: string;
  seasonId: number;
  createdBy: number;
  createdAt: string;
  contestantsPerTribe: number;
  pickDeadline: string | null;
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
  mvpSeasonContestantId: number;
  seasonContestantIds: number[];
  submittedAt: string;
}

export async function getLeagueMembers(leagueId: number): Promise<LeagueMember[]> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/members`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
  return res.json();
}

export async function getLeagueById(id: number): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch league: ${res.status}`);
  return res.json();
}

export async function getMyLeagues(userId: number): Promise<LeagueApiResponse[]> {
  const res = await apiFetch(`${API_BASE}/leagues?userId=${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch leagues: ${res.status}`);
  return res.json();
}

export async function createLeague(name: string, seasonId: number, userId: number): Promise<LeagueApiResponse> {
  const res = await apiFetch(`${API_BASE}/leagues`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, seasonId, userId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create league");
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

export async function getLeague(leagueId: string): Promise<League | null> {
  // TODO: fetch(`${API_BASE}/leagues/${leagueId}`)
  return mockLeagues.find((l) => l.id === leagueId) ?? null;
}

export async function getLeagueRosters(_leagueId: string): Promise<UserRoster[]> {
  // TODO: fetch(`${API_BASE}/leagues/${_leagueId}/rosters`)
  return [myRoster, ...otherRosters];
}

export async function getMyRoster(leagueId: number, userId: number): Promise<RosterResponse | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters/me?userId=${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch roster: ${res.status}`);
  return res.json();
}

export async function submitRoster(leagueId: number, userId: number, seasonContestantIds: number[], mvpSeasonContestantId: number): Promise<RosterResponse> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/rosters`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, seasonContestantIds, mvpSeasonContestantId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to submit roster");
  }
  return res.json();
}

export async function getContestants(season: string): Promise<Contestant[]> {
  // TODO: fetch(`${API_BASE}/contestants?season=${season}`)
  return mockContestants.filter((c) => c.season === season);
}

export async function getMyLeagueRole(leagueId: number, userId: number): Promise<"ADMIN" | "MEMBER" | null> {
  const res = await apiFetch(`${API_BASE}/leagues/${leagueId}/my-role?userId=${userId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch role: ${res.status}`);
  const data = await res.json();
  return data.role;
}

export async function getSeasonById(id: number): Promise<Season> {
  const res = await apiFetch(`${API_BASE}/seasons/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch season: ${res.status}`);
  return res.json();
}

export async function getEpisodeScores(seasonId: number, episodeNumber: number): Promise<EpisodeScoreItem[]> {
  const res = await apiFetch(`${API_BASE}/seasons/${seasonId}/episodes/${episodeNumber}/scores`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch scores: ${res.status}`);
  return res.json();
}

export async function saveEpisodeScores(seasonId: number, episodeNumber: number, scores: EpisodeScoreItem[]): Promise<EpisodeScoreItem[]> {
  const res = await apiFetch(`${API_BASE}/seasons/${seasonId}/episodes/${episodeNumber}/scores`, {
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

export async function getSeasons(): Promise<Season[]> {
  const res = await apiFetch(`${API_BASE}/seasons`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch seasons: ${res.status}`);
  return res.json();
}

export async function getSeasonContestants(seasonId: number): Promise<SeasonContestant[]> {
  const res = await apiFetch(`${API_BASE}/seasons/${seasonId}/contestants`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch contestants: ${res.status}`);
  return res.json();
}
