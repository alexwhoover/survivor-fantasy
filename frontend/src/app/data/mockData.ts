export interface Contestant {
  id: string;
  name: string;
  tribe: string;
  season: string;
  eliminated: boolean;
  episodePoints: { [episode: number]: number };
}

export interface League {
  id: string;
  name: string;
  code: string;
  season: string;
  pickDeadline: Date;
  mergEpisode: number;
  currentEpisode: number;
  mvpBonus: number;
  contestantsPerTribe: number;
}

export interface UserRoster {
  userId: string;
  userName: string;
  leagueId: string;
  contestants: string[];
  mvpId: string;
  totalPoints: number;
}

// Mock contestants for Season 47
export const mockContestants: Contestant[] = [
  // Gata Tribe (Red)
  { id: "c1", name: "Jon Lovett", tribe: "Gata", season: "47", eliminated: false, episodePoints: { 1: 12, 2: 8, 3: 15, 4: 10, 5: 7 } },
  { id: "c2", name: "Andy Rueda", tribe: "Gata", season: "47", eliminated: false, episodePoints: { 1: 5, 2: 14, 3: 6, 4: 9, 5: 11 } },
  { id: "c3", name: "Rachel LaMont", tribe: "Gata", season: "47", eliminated: false, episodePoints: { 1: 18, 2: 12, 3: 20, 4: 15, 5: 13 } },
  { id: "c4", name: "Anika Dhar", tribe: "Gata", season: "47", eliminated: true, episodePoints: { 1: 8, 2: 5, 3: 4 } },
  { id: "c5", name: "Sierra Wright", tribe: "Gata", season: "47", eliminated: false, episodePoints: { 1: 10, 2: 7, 3: 9, 4: 8, 5: 12 } },
  { id: "c6", name: "Sam Phalen", tribe: "Gata", season: "47", eliminated: false, episodePoints: { 1: 14, 2: 10, 3: 11, 4: 13, 5: 9 } },

  // Lavo Tribe (Yellow)
  { id: "c7", name: "Genevieve Mushaluk", tribe: "Lavo", season: "47", eliminated: false, episodePoints: { 1: 16, 2: 13, 3: 14, 4: 12, 5: 16 } },
  { id: "c8", name: "Kishan Patel", tribe: "Lavo", season: "47", eliminated: true, episodePoints: { 1: 6, 2: 4 } },
  { id: "c9", name: "Rome Cooney", tribe: "Lavo", season: "47", eliminated: true, episodePoints: { 1: 9, 2: 11, 3: 7, 4: 8 } },
  { id: "c10", name: "Teeny Chirichillo", tribe: "Lavo", season: "47", eliminated: false, episodePoints: { 1: 11, 2: 9, 3: 13, 4: 10, 5: 14 } },
  { id: "c11", name: "Sol Yi", tribe: "Lavo", season: "47", eliminated: false, episodePoints: { 1: 13, 2: 15, 3: 10, 4: 11, 5: 8 } },
  { id: "c12", name: "Aysha Welch", tribe: "Lavo", season: "47", eliminated: true, episodePoints: { 1: 7 } },

  // Tuku Tribe (Blue)
  { id: "c13", name: "Gabe Ortis", tribe: "Tuku", season: "47", eliminated: false, episodePoints: { 1: 15, 2: 11, 3: 12, 4: 14, 5: 10 } },
  { id: "c14", name: "Kyle Fraser", tribe: "Tuku", season: "47", eliminated: false, episodePoints: { 1: 12, 2: 16, 3: 11, 4: 9, 5: 15 } },
  { id: "c15", name: "Tiyana Hallums", tribe: "Tuku", season: "47", eliminated: true, episodePoints: { 1: 9, 2: 6, 3: 5, 4: 7 } },
  { id: "c16", name: "Sue Smey", tribe: "Tuku", season: "47", eliminated: false, episodePoints: { 1: 14, 2: 10, 3: 16, 4: 12, 5: 11 } },
  { id: "c17", name: "Caroline Vidmar", tribe: "Tuku", season: "47", eliminated: false, episodePoints: { 1: 10, 2: 13, 3: 8, 4: 11, 5: 14 } },
  { id: "c18", name: "TK Foster", tribe: "Tuku", season: "47", eliminated: true, episodePoints: { 1: 6, 2: 8 } },
];

// Mock leagues
export const mockLeagues: League[] = [
  {
    id: "league1",
    name: "Office Survivor League",
    code: "TORCH47",
    season: "47",
    pickDeadline: new Date("2024-09-18T20:00:00"),
    mergEpisode: 7,
    currentEpisode: 5,
    mvpBonus: 50,
    contestantsPerTribe: 2,
  },
  {
    id: "league2",
    name: "Family Fantasy",
    code: "FIRE123",
    season: "47",
    pickDeadline: new Date("2024-09-18T20:00:00"),
    mergEpisode: 7,
    currentEpisode: 5,
    mvpBonus: 100,
    contestantsPerTribe: 2,
  },
];

// Mock user roster (current user)
export const myRoster: UserRoster = {
  userId: "user1",
  userName: "You",
  leagueId: "league1",
  contestants: ["c3", "c6", "c7", "c10", "c13", "c16"], // Rachel, Sam, Genevieve, Teeny, Gabe, Sue
  mvpId: "c3", // Rachel
  totalPoints: 0,
};

// Mock other users in league
export const otherRosters: UserRoster[] = [
  {
    userId: "user2",
    userName: "Sarah M.",
    leagueId: "league1",
    contestants: ["c1", "c2", "c11", "c12", "c14", "c17"],
    mvpId: "c14",
    totalPoints: 0,
  },
  {
    userId: "user3",
    userName: "Mike T.",
    leagueId: "league1",
    contestants: ["c4", "c5", "c8", "c9", "c15", "c18"],
    mvpId: "c5",
    totalPoints: 0,
  },
  {
    userId: "user4",
    userName: "Jessica L.",
    leagueId: "league1",
    contestants: ["c1", "c5", "c7", "c9", "c13", "c14"],
    mvpId: "c7",
    totalPoints: 0,
  },
];

// Calculate total points for a roster
export function calculateRosterPoints(roster: UserRoster, contestants: Contestant[]): number {
  let total = 0;
  roster.contestants.forEach((contestantId) => {
    const contestant = contestants.find((c) => c.id === contestantId);
    if (contestant) {
      const episodePoints = Object.values(contestant.episodePoints).reduce((sum, pts) => sum + pts, 0);
      total += episodePoints;
    }
  });
  return total;
}

export const seasons = [
  { id: "47", name: "Season 47 (2024)" },
  { id: "46", name: "Season 46 (2024)" },
  { id: "45", name: "Season 45 (2023)" },
];
