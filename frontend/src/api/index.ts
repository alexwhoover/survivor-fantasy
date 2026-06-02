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
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  winnerContestantId: number | null;
}

export interface SeasonContestant {
  id: number;
  firstName: string;
  lastName: string;
  hometown: string | null;
  state: string | null;
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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = sessionStorage.getItem("survivor_session");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
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
  sessionStorage.removeItem("survivor_session");
}

export async function getMyLeagues(): Promise<League[]> {
  // TODO: fetch(`${API_BASE}/leagues`)
  return mockLeagues;
}

export async function createLeague(name: string): Promise<League> {
  // TODO: fetch(`${API_BASE}/leagues`, { method: "POST", body: JSON.stringify({ name }) })
  return { ...mockLeagues[0], id: `league-${Date.now()}`, name, code: "NEW123" };
}

export async function joinLeague(code: string): Promise<League> {
  // TODO: fetch(`${API_BASE}/leagues/join`, { method: "POST", body: JSON.stringify({ code }) })
  const league = mockLeagues.find((l) => l.code === code);
  if (!league) throw new Error("League not found");
  return league;
}

export async function getLeague(leagueId: string): Promise<League | null> {
  // TODO: fetch(`${API_BASE}/leagues/${leagueId}`)
  return mockLeagues.find((l) => l.id === leagueId) ?? null;
}

export async function getLeagueRosters(leagueId: string): Promise<UserRoster[]> {
  // TODO: fetch(`${API_BASE}/leagues/${leagueId}/rosters`)
  return [myRoster, ...otherRosters].filter((r) => r.leagueId === leagueId);
}

export async function getMyRoster(leagueId: string): Promise<UserRoster | null> {
  // TODO: fetch(`${API_BASE}/leagues/${leagueId}/rosters/me`)
  return myRoster.leagueId === leagueId ? myRoster : null;
}

export async function submitRoster(leagueId: string, contestants: string[], mvpId: string): Promise<void> {
  // TODO: fetch(`${API_BASE}/leagues/${leagueId}/rosters`, { method: "POST", body: JSON.stringify({ contestants, mvpId }) })
  console.log("submitRoster:", { leagueId, contestants, mvpId });
}

export async function getContestants(season: string): Promise<Contestant[]> {
  // TODO: fetch(`${API_BASE}/contestants?season=${season}`)
  return mockContestants.filter((c) => c.season === season);
}

export async function getSeasons(): Promise<Season[]> {
  const res = await fetch(`${API_BASE}/seasons`);
  if (!res.ok) throw new Error(`Failed to fetch seasons: ${res.status}`);
  return res.json();
}

export async function getSeasonContestants(seasonId: number): Promise<SeasonContestant[]> {
  const res = await fetch(`${API_BASE}/seasons/${seasonId}/contestants`);
  if (!res.ok) throw new Error(`Failed to fetch contestants: ${res.status}`);
  return res.json();
}
