import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Archive, Crown, GitMerge, Medal } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAdmin } from "../context/AdminContext";
import { AdminPlayers } from "../components/AdminPlayers";
import { AdminSeason } from "../components/AdminSeason";
import { ScoringGrid } from "../components/ScoringGrid";
import { StandingsGraph } from "../components/StandingsGraph";
import {
  getLeagueById,
  getLeagueCast,
  getPlayers,
  getLeaderboard,
  getAllRosters,
  type LeagueApiResponse,
  type Tribe,
  type Contestant,
  type RosterResponse,
  type Player,
  type LeaderboardEntry,
} from "../../api";

type Tab = "standings" | "rosters" | "admin";
type StandingsView = "leaderboard" | "graph" | "scoring";
type AdminSubtab = "players" | "season";

// ─── Tab bar ─────────────────────────────────────────────────────────────────

/**
 * Horizontal tabs rather than the old left rail: a 220px sidebar has nowhere to go on
 * a phone, and with three destinations a row of tabs reads the same at every width.
 */
function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onSelect(tab.id)}
          className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm transition-colors sm:px-4 ${
            active === tab.id
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick} className="min-h-[36px] flex-1 sm:flex-none">
      {children}
    </Button>
  );
}

// ─── Rosters tab ─────────────────────────────────────────────────────────────

/**
 * One card per player, all of them on the page at once. Previously a roster was
 * something you opened a modal to peek at — now that nobody has a roster "of their
 * own", comparing them side by side is the whole point of the view.
 */
function RosterCard({
  player,
  roster,
  contestants,
  tribes,
  points,
  total,
}: {
  player: Player;
  roster: RosterResponse | undefined;
  contestants: Contestant[];
  tribes: Tribe[];
  points: Record<number, number>;
  total: number | undefined;
}) {
  const mergeAction = roster?.mergeAction ?? null;
  const addedId = mergeAction?.addedContestantId ?? null;
  const removedId = mergeAction?.actionType === "SWAP" ? mergeAction.removedContestantId : null;

  const byId = (id: number) => contestants.find((c) => c.id === id);

  // The contestant swapped out at the merge can still be in the pick list (reverting an
  // admin override restores it, and seeded leagues carry it), so it's pulled out here —
  // otherwise it renders twice, once struck through and again as a current pick.
  const picks = (roster?.contestantIds ?? [])
    .filter((id) => id !== removedId)
    .map(byId)
    .filter(Boolean) as Contestant[];

  // Tribe order follows the league's own, so the same castaway sits in the same place
  // on every card and the cards can be read against each other.
  const ordered = [
    ...tribes.flatMap((t) => picks.filter((c) => c.tribeId === t.id)),
    ...picks.filter((c) => c.tribeId === null || !tribes.some((t) => t.id === c.tribeId)),
  ];

  const removed = removedId !== null ? byId(removedId) : undefined;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2.5">
        <span className="truncate text-base font-medium">{player.username}</span>
        <span className="shrink-0 text-sm text-muted-foreground">
          <span className="text-base font-semibold text-primary tabular-nums">{total ?? 0}</span> pts
        </span>
      </div>

      {!roster ? (
        <p className="text-sm text-muted-foreground">No roster yet.</p>
      ) : (
        <div className="space-y-1">
          {removed && (
            <RosterRow
              contestant={removed}
              points={points[removed.id] ?? 0}
              struck
              note="swapped out at merge"
            />
          )}
          {ordered.map((c) => (
            <RosterRow
              key={c.id}
              contestant={c}
              points={points[c.id] ?? 0}
              isMVP={c.id === roster.mvpContestantId}
              isMergePick={c.id === addedId}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function RosterRow({
  contestant,
  points,
  isMVP,
  isMergePick,
  struck,
  note,
}: {
  contestant: Contestant;
  points: number;
  isMVP?: boolean;
  isMergePick?: boolean;
  struck?: boolean;
  note?: string;
}) {
  const isOut = contestant.eliminatedEpisode !== null;
  return (
    <div className={`flex items-start justify-between gap-2 py-1.5 ${struck ? "opacity-60" : ""}`}>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {contestant.tribeColour && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: contestant.tribeColour }}
          />
        )}
        <span
          className={`text-sm ${struck ? "text-muted-foreground line-through" : isOut ? "text-muted-foreground" : "font-medium"}`}
        >
          {contestant.firstName} {contestant.lastName}
        </span>
        {isMVP && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="MVP" />}
        {isMergePick && <GitMerge className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Merge pick" />}
        {note && <span className="text-[11px] italic text-muted-foreground/70">{note}</span>}
        {isOut && !struck && (
          <span className="text-[11px] text-muted-foreground/70">E{contestant.eliminatedEpisode}</span>
        )}
      </div>
      <span className="shrink-0 text-sm tabular-nums">{points}</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LeagueOverview() {
  const { leagueId } = useParams();
  const { isAdmin } = useAdmin();

  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rosters, setRosters] = useState<RosterResponse[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("standings");
  const [adminSubtab, setAdminSubtab] = useState<AdminSubtab>("players");
  const [standingsView, setStandingsView] = useState<StandingsView>("leaderboard");

  const numId = Number(leagueId);

  const refreshStandings = useCallback(() => {
    getLeaderboard(numId).then(setLeaderboard).catch(() => {});
    getAllRosters(numId).then(setRosters).catch(() => {});
  }, [numId]);

  useEffect(() => {
    if (!leagueId) return;
    getLeagueById(numId).then(setLeague).catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load league"),
    );
    getLeagueCast(numId)
      .then((cast) => {
        setTribes(cast.tribes);
        setContestants(cast.contestants);
      })
      .catch(() => {});
    getPlayers(numId).then(setPlayers).catch(() => {});
    refreshStandings();
  }, [leagueId, numId, refreshStandings]);

  // The admin tab disappears on sign-out, so a stale selection would leave a blank page.
  useEffect(() => {
    if (!isAdmin && tab === "admin") setTab("standings");
  }, [isAdmin, tab]);

  const rosterByPlayer = useMemo(
    () => new Map(rosters.map((r) => [r.userId, r])),
    [rosters],
  );
  const entryByPlayer = useMemo(
    () => new Map(leaderboard.map((e) => [e.userId, e])),
    [leaderboard],
  );

  if (error) {
    return <p className="px-4 py-8 text-sm text-muted-foreground sm:px-6">{error}</p>;
  }

  if (!league) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const maxRosterSize = league.contestantsPerTribe * tribes.length;

  const tabs = [
    { id: "standings", label: "Standings" },
    { id: "rosters", label: "Rosters" },
    ...(isAdmin ? [{ id: "admin", label: "Admin" }] : []),
  ];

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl sm:text-3xl">{league.name}</h1>
          {league.archived && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Archive className="h-3 w-3" />
              Past season
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
          {league.seasonName}
          <span className="mx-2 text-muted-foreground/40">·</span>
          {players.length} player{players.length !== 1 ? "s" : ""}
          {league.mergeEpisode !== null && (
            <>
              <span className="mx-2 text-muted-foreground/40">·</span>
              merged ep. {league.mergeEpisode}
            </>
          )}
        </p>
      </div>

      <TabBar tabs={tabs} active={tab} onSelect={(id) => setTab(id as Tab)} />

      {/* ── Standings ── */}
      {tab === "standings" && (
        <Card className="p-3 sm:p-4">
          <div className="mb-3 flex gap-1">
            <SegmentedButton
              active={standingsView === "leaderboard"}
              onClick={() => setStandingsView("leaderboard")}
            >
              Leaderboard
            </SegmentedButton>
            <SegmentedButton active={standingsView === "graph"} onClick={() => setStandingsView("graph")}>
              Graph
            </SegmentedButton>
            <SegmentedButton active={standingsView === "scoring"} onClick={() => setStandingsView("scoring")}>
              Scoring
            </SegmentedButton>
          </div>

          {standingsView === "graph" ? (
            <StandingsGraph leagueId={numId} />
          ) : standingsView === "scoring" ? (
            <ScoringGrid leagueId={numId} players={players} rosters={rosters} />
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scores yet.</p>
          ) : (
            <div>
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between gap-3 py-2.5 ${
                    index < leaderboard.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {rankIcon(index + 1) ?? (
                        <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <span className="truncate text-sm font-medium">{entry.username}</span>
                  </div>
                  <span className="shrink-0 text-base font-medium tabular-nums">{entry.totalScore}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Rosters ── */}
      {tab === "rosters" &&
        (players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <RosterCard
                key={player.userId}
                player={player}
                roster={rosterByPlayer.get(player.userId)}
                contestants={contestants}
                tribes={tribes}
                points={entryByPlayer.get(player.userId)?.contestantPoints ?? {}}
                total={entryByPlayer.get(player.userId)?.totalScore}
              />
            ))}
          </div>
        ))}

      {/* ── Admin ── */}
      {tab === "admin" && isAdmin && (
        <>
          <div className="flex gap-1">
            <SegmentedButton active={adminSubtab === "players"} onClick={() => setAdminSubtab("players")}>
              Players
            </SegmentedButton>
            <SegmentedButton active={adminSubtab === "season"} onClick={() => setAdminSubtab("season")}>
              Season
            </SegmentedButton>
          </div>

          {adminSubtab === "players" ? (
            <AdminPlayers
              league={league}
              players={players}
              tribes={tribes}
              contestants={contestants}
              maxRosterSize={maxRosterSize}
              onPlayersUpdated={(updated) => {
                setPlayers(updated);
                refreshStandings();
              }}
              onRostersChanged={refreshStandings}
            />
          ) : (
            <AdminSeason
              league={league}
              contestants={contestants}
              onLeagueUpdated={setLeague}
              onContestantsChanged={setContestants}
              onScoresChanged={refreshStandings}
            />
          )}
        </>
      )}
    </div>
  );
}
