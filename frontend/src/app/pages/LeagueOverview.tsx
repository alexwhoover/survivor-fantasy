import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Crown, Eye, GitMerge, Medal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { AdminPlayers } from "../components/AdminPlayers";
import { AdminSeason } from "../components/AdminSeason";
import { MergeActionModal } from "../components/MergeActionModal";
import {
  getLeagueById,
  getLeagueContestants,
  getLeagueTribes,
  getMyRoster,
  getLeagueMembers,
  getMyLeagueRole,
  getLeaderboard,
  getMergeStatus,
  getMyMergeAction,
  getRosterForUser,
  type LeagueApiResponse,
  type Tribe,
  type Contestant,
  type RosterResponse,
  type LeagueMember,
  type LeaderboardEntry,
  type MergeStatusResponse,
  type MergeActionResponse,
} from "../../api";

type Tab = "roster" | "standings" | "admin";
type AdminSubtab = "players" | "season";

// ─── Roster view modal ────────────────────────────────────────────────────────

function RosterViewModal({
  member,
  leagueId,
  contestants,
  onClose,
}: {
  member: LeagueMember | null;
  leagueId: number;
  contestants: Contestant[];
  onClose: () => void;
}) {
  const [roster, setRoster] = useState<RosterResponse | null | undefined>(undefined);

  useEffect(() => {
    if (!member) return;
    setRoster(undefined);
    getRosterForUser(leagueId, member.userId).then(setRoster);
  }, [member, leagueId]);

  const rosterContestants =
    roster?.contestantIds
      .map((id) => contestants.find((c) => c.id === id))
      .filter(Boolean) as Contestant[] ?? [];

  const mvp = roster ? contestants.find((c) => c.id === roster.mvpContestantId) : null;

  return (
    <Dialog open={member !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        {member && (
          <>
            <DialogHeader>
              <DialogTitle>{member.username}'s Roster</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {roster === undefined ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : roster === null ? (
                <p className="text-sm text-muted-foreground">No roster submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {rosterContestants.map((c) => {
                    const isMVP = c.id === roster.mvpContestantId;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-4 py-3 rounded-lg border"
                        style={isMVP ? { borderColor: "var(--primary)", backgroundColor: "var(--accent)" } : {}}
                      >
                        <div className="flex items-center gap-3">
                          {isMVP && <Crown className="h-4 w-4 text-primary" />}
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {c.firstName} {c.lastName}
                              {isMVP && <Badge variant="outline">MVP</Badge>}
                              {c.eliminatedEpisode !== null && (
                                <Badge variant="destructive">Out Ep.{c.eliminatedEpisode}</Badge>
                              )}
                            </div>
                            {c.tribe && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                {c.tribeColour && (
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.tribeColour }} />
                                )}
                                {c.tribe}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Merge alert banner ───────────────────────────────────────────────────────

function MergeAlert({
  mergeStatus,
  hasActed,
  onOpenMergeAction,
}: {
  mergeStatus: MergeStatusResponse;
  hasActed: boolean;
  onOpenMergeAction: () => void;
}) {
  if (!mergeStatus.initiated) return null;

  if (hasActed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-600/30 bg-green-950/20 text-sm">
        <GitMerge className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-green-400 font-medium">Merge action complete.</span>
      </div>
    );
  }

  if (!mergeStatus.mergePicksOpen) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        <GitMerge className="h-4 w-4 shrink-0" />
        Merge picks aren't open right now.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-primary/50 bg-accent">
      <div className="flex items-center gap-3 text-sm">
        <GitMerge className="h-4 w-4 text-primary shrink-0" />
        <span>
          <span className="font-semibold text-primary">Merge is active</span>
          {" — "}Episode {mergeStatus.mergeEpisode}. You haven't made your move yet.
        </span>
      </div>
      <Button size="sm" onClick={onOpenMergeAction} className="gap-1.5 shrink-0">
        <GitMerge className="h-3.5 w-3.5" />
        Make Move
      </Button>
    </div>
  );
}

// ─── Left-rail nav ──────────────────────────────────────────────────────────────

function RailButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors ${
        active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </button>
  );
}

function RailSubButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
        active ? "text-primary font-medium" : "text-muted-foreground hover:bg-accent/40"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeagueOverview() {
  const { leagueId } = useParams();
  const { user } = useAuth();

  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [myRoster, setMyRoster] = useState<RosterResponse | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [myRole, setMyRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mergeStatus, setMergeStatus] = useState<MergeStatusResponse | null>(null);
  const [myMergeAction, setMyMergeAction] = useState<MergeActionResponse | null>(null);
  const [viewingMember, setViewingMember] = useState<LeagueMember | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  const [tab, setTab] = useState<Tab>("roster");
  const [adminSubtab, setAdminSubtab] = useState<AdminSubtab>("players");

  const numId = Number(leagueId);

  const refreshLeaderboard = useCallback(() => {
    getLeaderboard(numId).then(setLeaderboard).catch(() => {});
  }, [numId]);

  const refreshMergeStatus = useCallback(() => {
    getMergeStatus(numId).then(setMergeStatus).catch(() => {});
  }, [numId]);

  const refreshContestants = useCallback(() => {
    getLeagueContestants(numId).then(setContestants).catch(() => {});
  }, [numId]);

  // Initial data load
  useEffect(() => {
    if (!leagueId) return;
    getLeagueById(numId).then(setLeague);
    refreshContestants();
    getLeagueTribes(numId).then(setTribes);
    getLeagueMembers(numId).then(setLeagueMembers);
    refreshLeaderboard();
    refreshMergeStatus();
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !user) return;
    getMyRoster(numId, user.id).then(setMyRoster);
    getMyLeagueRole(numId, user.id).then(setMyRole);
    getMyMergeAction(numId, user.id).then(setMyMergeAction).catch(() => {});
  }, [leagueId, user]);

  if (!league) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const myRosterContestants = myRoster
    ? (myRoster.contestantIds
        .map((id) => contestants.find((c) => c.id === id))
        .filter(Boolean) as Contestant[])
    : [];

  const mvpContestant = myRoster
    ? (contestants.find((c) => c.id === myRoster.mvpContestantId) ?? null)
    : null;

  const isAdmin = myRole === "ADMIN";
  const maxRosterSize = league.contestantsPerTribe * tribes.length;

  const myMergeStatus = mergeStatus?.memberStatuses.find((m) => m.userId === user?.id);
  const myHasActed = myMergeStatus?.hasActed ?? false;

  const canEditRoster = isAdmin || league.initialPicksOpen;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === "admin") setAdminSubtab("players");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* ── Left rail ── */}
      <div className="w-[220px] shrink-0 border-r border-border px-3.5 py-5 flex flex-col gap-0.5">
        <div className="px-2 pb-4">
          <div className="text-[15px] font-medium text-foreground">{league.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{league.seasonName}</div>
        </div>
        <RailButton active={tab === "roster"} onClick={() => goTab("roster")}>My Roster</RailButton>
        <RailButton active={tab === "standings"} onClick={() => goTab("standings")}>Standings</RailButton>
        {isAdmin && (
          <>
            <RailButton active={tab === "admin"} onClick={() => goTab("admin")}>Admin</RailButton>
            {tab === "admin" && (
              <div className="flex flex-col gap-0.5 ml-2.5 pl-2.5 my-0.5 border-l border-border">
                <RailSubButton active={adminSubtab === "players"} onClick={() => setAdminSubtab("players")}>
                  Players
                </RailSubButton>
                <RailSubButton active={adminSubtab === "season"} onClick={() => setAdminSubtab("season")}>
                  Season
                </RailSubButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 px-10 py-8 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1">{league.name}</h1>
            <p className="text-muted-foreground">{league.seasonName}</p>
          </div>
          {canEditRoster && (
            <Link to={`/league/${leagueId}/pick`}>
              <Button variant="secondary">{myRoster ? "Edit Roster" : "Make Picks"}</Button>
            </Link>
          )}
        </div>

        {/* Info row */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Members</div>
            <div className="text-lg font-medium mt-0.5">{leagueMembers.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">League Code</div>
            <div className="text-lg font-medium mt-0.5 font-mono text-primary">{league.code}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Picking</div>
            <div className="flex flex-col gap-1 mt-1">
              <Badge
                variant="outline"
                className={`w-fit ${league.initialPicksOpen ? "bg-green-500/10 text-green-500 border-green-500" : ""}`}
              >
                Initial: {league.initialPicksOpen ? "Open" : "Closed"}
              </Badge>
              <Badge
                variant="outline"
                className={`w-fit ${
                  !mergeStatus?.initiated ? "" : mergeStatus.mergePicksOpen ? "bg-green-500/10 text-green-500 border-green-500" : ""
                }`}
              >
                Merge: {!mergeStatus?.initiated ? "N/A" : mergeStatus.mergePicksOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </Card>
        </div>

        {/* ── My Roster tab ── */}
        {tab === "roster" && (
          <div className="space-y-4">
            {mergeStatus && user && (
              <MergeAlert
                mergeStatus={mergeStatus}
                hasActed={myHasActed}
                onOpenMergeAction={() => setMergeModalOpen(true)}
              />
            )}

            {myRoster ? (
              <Card style={{ padding: "16px" }}>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Picks</div>
                <div className="text-base font-medium mb-2.5">
                  {myRosterContestants.length} contestant{myRosterContestants.length !== 1 ? "s" : ""} selected
                </div>
                <div className="space-y-1">
                  {/* Removed contestant — shown at top when a swap occurred */}
                  {myMergeAction?.actionType === "SWAP" && myMergeAction.removedContestantId && (() => {
                    const removed = contestants.find((c) => c.id === myMergeAction.removedContestantId);
                    if (!removed) return null;
                    return (
                      <div
                        key={`removed-${removed.id}`}
                        className="flex items-center justify-between py-2.5 px-1 border-b border-border opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          {removed.tribeColour && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: removed.tribeColour }} />
                          )}
                          <span className="text-sm font-medium line-through text-muted-foreground">
                            {removed.firstName} {removed.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground/70 italic">Removed in Merge Swap</span>
                        </div>
                      </div>
                    );
                  })()}

                  {myRosterContestants.map((contestant, i) => {
                    const isMVP = contestant.id === myRoster.mvpContestantId;
                    const isMergeAdded = myMergeAction?.addedContestantId === contestant.id;
                    return (
                      <div
                        key={contestant.id}
                        className={`flex items-center justify-between py-2.5 px-1 ${
                          i < myRosterContestants.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {contestant.tribeColour && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: contestant.tribeColour }} />
                          )}
                          <span className="text-sm font-medium">{contestant.firstName} {contestant.lastName}</span>
                          {isMVP && <Badge variant="outline" className="gap-1"><Crown className="h-3 w-3" />MVP</Badge>}
                          {isMergeAdded && (
                            <Badge variant="secondary" className="gap-1">
                              <GitMerge className="h-3 w-3" />
                              Added in Merge
                            </Badge>
                          )}
                          {contestant.eliminatedEpisode !== null && (
                            <Badge variant="outline" className="text-muted-foreground">Out</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">{contestant.totalPoints} pts</span>
                      </div>
                    );
                  })}
                </div>

                {mvpContestant && (
                  <div className="mt-4 p-3 rounded-lg bg-accent border border-primary/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">MVP Pick: {mvpContestant.firstName} {mvpContestant.lastName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +30 bonus points if they win the season.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">You haven't submitted your picks yet.</p>
                  {canEditRoster && (
                    <Link to={`/league/${leagueId}/pick`}>
                      <Button>Make Picks</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Standings tab ── */}
        {tab === "standings" && (
          <Card style={{ padding: "16px" }}>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Leaderboard</div>
            <div className="text-base font-medium mb-2.5">Scores updated after each episode</div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scores yet.</p>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = user && entry.userId === user.id;
                  const member = leagueMembers.find((m) => m.userId === entry.userId);
                  const rank = index + 1;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between py-2.5 px-1 ${
                        index < leaderboard.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6">
                          {rankIcon(rank) ?? <span className="text-xs font-bold text-muted-foreground">{rank}</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{entry.username}</span>
                          {isCurrentUser && <Badge variant="outline">You</Badge>}
                          {member?.role === "ADMIN" && <Badge variant="secondary">Admin</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium">{entry.totalScore}</span>
                        {member && !isCurrentUser && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setViewingMember(member)}>
                            <Eye className="h-3.5 w-3.5" />
                            Roster
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ── Admin tab ── */}
        {tab === "admin" && isAdmin && (
          <>
            {adminSubtab === "players" && (
              <AdminPlayers
                league={league}
                adminUserId={user!.id}
                members={leagueMembers}
                contestants={contestants}
                mergeStatus={mergeStatus}
                maxRosterSize={maxRosterSize}
                onMergeStatusUpdated={(status) => {
                  setMergeStatus(status);
                  refreshLeaderboard();
                }}
              />
            )}
            {adminSubtab === "season" && (
              <AdminSeason
                league={league}
                adminUserId={user!.id}
                tribes={tribes}
                contestants={contestants}
                onLeagueUpdated={setLeague}
                onContestantsChanged={setContestants}
                onMergeStatusChanged={refreshMergeStatus}
                onScoresChanged={() => { refreshLeaderboard(); refreshContestants(); }}
              />
            )}
          </>
        )}
      </div>

      {/* View-roster modal */}
      <RosterViewModal
        member={viewingMember}
        leagueId={numId}
        contestants={contestants}
        onClose={() => setViewingMember(null)}
      />

      {/* Merge action modal */}
      {user && myRoster && mergeStatus?.initiated && !myHasActed && (
        <MergeActionModal
          open={mergeModalOpen}
          onClose={() => setMergeModalOpen(false)}
          leagueId={numId}
          userId={user.id}
          currentRoster={myRoster}
          contestants={contestants}
          maxRosterSize={maxRosterSize}
          onSuccess={(status) => {
            setMergeStatus(status);
            getMyRoster(numId, user.id).then(setMyRoster);
            getMyMergeAction(numId, user.id).then(setMyMergeAction).catch(() => {});
            refreshLeaderboard();
          }}
        />
      )}
    </div>
  );
}
