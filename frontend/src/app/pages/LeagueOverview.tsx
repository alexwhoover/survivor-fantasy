import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Crown, Eye, Trophy, GitMerge, Medal, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAuth } from "../context/AuthContext";
import { EpisodeScores } from "./EpisodeScores";
import { AdminRosters } from "../components/AdminRosters";
import { UserStatus } from "../components/UserStatus";
import { MergeActionModal } from "../components/MergeActionModal";
import {
  getLeagueById,
  getSeasonContestants,
  getSeasonById,
  getMyRoster,
  getLeagueMembers,
  getMyLeagueRole,
  getLeaderboard,
  getMergeStatus,
  getMyMergeAction,
  getRosterForUser,
  type LeagueApiResponse,
  type Season,
  type SeasonContestant,
  type RosterResponse,
  type LeagueMember,
  type LeaderboardEntry,
  type MergeStatusResponse,
  type MergeActionResponse,
} from "../../api";

// ─── Roster view modal ────────────────────────────────────────────────────────

function RosterViewModal({
  member,
  leagueId,
  seasonContestants,
  onClose,
}: {
  member: LeagueMember | null;
  leagueId: number;
  seasonContestants: SeasonContestant[];
  onClose: () => void;
}) {
  const [roster, setRoster] = useState<RosterResponse | null | undefined>(undefined);

  useEffect(() => {
    if (!member) return;
    setRoster(undefined);
    getRosterForUser(leagueId, member.userId).then(setRoster);
  }, [member, leagueId]);

  const rosterContestants =
    roster?.seasonContestantIds
      .map((id) => seasonContestants.find((c) => c.id === id))
      .filter(Boolean) as SeasonContestant[] ?? [];

  const mvp = roster ? seasonContestants.find((c) => c.id === roster.mvpSeasonContestantId) : null;

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
                    const isMVP = c.id === roster.mvpSeasonContestantId;
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

  if (mergeStatus.deadlinePassed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        <GitMerge className="h-4 w-4 shrink-0" />
        The merge window has closed.
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

// ─── Main component ───────────────────────────────────────────────────────────

export function LeagueOverview() {
  const { leagueId } = useParams();
  const { user } = useAuth();

  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [seasonContestants, setSeasonContestants] = useState<SeasonContestant[]>([]);
  const [myRoster, setMyRoster] = useState<RosterResponse | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [myRole, setMyRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mergeStatus, setMergeStatus] = useState<MergeStatusResponse | null>(null);
  const [myMergeAction, setMyMergeAction] = useState<MergeActionResponse | null>(null);
  const [viewingMember, setViewingMember] = useState<LeagueMember | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  const numId = Number(leagueId);

  const refreshLeaderboard = useCallback(() => {
    getLeaderboard(numId).then(setLeaderboard).catch(() => {});
  }, [numId]);

  const refreshMergeStatus = useCallback(() => {
    getMergeStatus(numId).then(setMergeStatus).catch(() => {});
  }, [numId]);

  // Initial data load
  useEffect(() => {
    if (!leagueId) return;
    getLeagueById(numId).then((l) => {
      setLeague(l);
      getSeasonContestants(l.seasonId).then(setSeasonContestants);
      getSeasonById(l.seasonId).then(setSeason);
    });
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
    ? (myRoster.seasonContestantIds
        .map((id) => seasonContestants.find((c) => c.id === id))
        .filter(Boolean) as SeasonContestant[])
    : [];

  const mvpContestant = myRoster
    ? (seasonContestants.find((c) => c.id === myRoster.mvpSeasonContestantId) ?? null)
    : null;

  const isAdmin = myRole === "ADMIN";
  const maxRosterSize = league.contestantsPerTribe * [...new Set(seasonContestants.map((c) => c.tribe).filter(Boolean))].length;

  const myMergeStatus = mergeStatus?.memberStatuses.find((m) => m.userId === user?.id);
  const myHasActed = myMergeStatus?.hasActed ?? false;

  const mergeActive =
    mergeStatus?.initiated &&
    !mergeStatus.deadlinePassed &&
    !myHasActed &&
    myRoster !== null;

  const canEditRoster = !league.pickDeadline || isAdmin
    ? true
    : new Date() < new Date(league.pickDeadline);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-1">{league.name}</h1>
            {season && <p className="text-muted-foreground">{season.name}</p>}
          </div>
          {canEditRoster && (
            <Link to={`/league/${leagueId}/pick`}>
              <Button>{myRoster ? "Edit Roster" : "Make Picks"}</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leagueMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">League Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-primary">{league.code}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {league.mergeEpisode ? "Merge Episode" : "Pick Deadline"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {league.mergeEpisode ? (
                <div className="text-3xl font-bold text-primary">{league.mergeEpisode}</div>
              ) : league.pickDeadline ? (
                <div className="text-sm font-medium">
                  {new Date(league.pickDeadline).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Not set</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="roster">My Roster</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* ── My Roster tab ── */}
        <TabsContent value="roster" className="space-y-4">
          {/* Merge action alert */}
          {mergeStatus && user && (
            <MergeAlert
              mergeStatus={mergeStatus}
              hasActed={myHasActed}
              onOpenMergeAction={() => setMergeModalOpen(true)}
            />
          )}

          {myRoster ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Picks</CardTitle>
                <CardDescription>
                  {myRosterContestants.length} contestant{myRosterContestants.length !== 1 ? "s" : ""} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Removed contestant — shown at top when a swap occurred */}
                {myMergeAction?.actionType === "SWAP" && myMergeAction.removedSeasonContestantId && (() => {
                  const removed = seasonContestants.find((c) => c.id === myMergeAction.removedSeasonContestantId);
                  if (!removed) return null;
                  return (
                    <div
                      key={`removed-${removed.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-dashed border-muted-foreground/40 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-sm line-through text-muted-foreground">
                            {removed.firstName} {removed.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {removed.tribe && removed.tribeColour && (
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: removed.tribeColour }} />
                            )}
                            <span className="text-xs text-muted-foreground/70 italic">Removed in Merge Swap</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {myRosterContestants.map((contestant) => {
                  const isMVP = contestant.id === myRoster.mvpSeasonContestantId;
                  const isMergeAdded = myMergeAction?.addedSeasonContestantId === contestant.id;
                  return (
                    <div
                      key={contestant.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      style={isMVP ? { borderColor: "var(--primary)", backgroundColor: "var(--accent)" } : {}}
                    >
                      <div className="flex items-center gap-3">
                        {isMVP && <Crown className="h-5 w-5 text-primary" />}
                        <div>
                          <div className="flex items-center flex-wrap gap-2 font-semibold text-sm">
                            {contestant.firstName} {contestant.lastName}
                            {isMVP && <Badge variant="outline">MVP</Badge>}
                            {isMergeAdded && (
                              <Badge variant="secondary" className="gap-1">
                                <GitMerge className="h-3 w-3" />
                                Added in Merge
                              </Badge>
                            )}
                            {contestant.eliminatedEpisode !== null && (
                              <Badge variant="destructive">Out Ep.{contestant.eliminatedEpisode}</Badge>
                            )}
                          </div>
                          {contestant.tribe && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              {contestant.tribeColour && (
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: contestant.tribeColour }} />
                              )}
                              {contestant.tribe} Tribe
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {mvpContestant && (
                  <div className="mt-4 p-4 rounded-lg bg-accent border border-primary/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">MVP Pick: {mvpContestant.firstName} {mvpContestant.lastName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +30 bonus points if they win the season.
                    </p>
                  </div>
                )}
              </CardContent>
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
        </TabsContent>

        {/* ── Standings tab ── */}
        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Scores updated after each episode</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scores yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = user && entry.userId === user.id;
                    const member = leagueMembers.find((m) => m.userId === entry.userId);
                    const rank = index + 1;

                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCurrentUser ? "border-primary bg-accent" : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8">
                            {rankIcon(rank) ?? (
                              <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{entry.username}</span>
                            {isCurrentUser && <Badge variant="outline">You</Badge>}
                            {member?.role === "ADMIN" && <Badge variant="outline">Admin</Badge>}
                            {entry.mvpBonusApplied && (
                              <Badge className="gap-1">
                                <Crown className="h-3 w-3" />
                                MVP +30
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold">{entry.totalScore}</span>
                          {member && !isCurrentUser && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => setViewingMember(member)}
                            >
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Admin tab ── */}
        {isAdmin && season && (
          <TabsContent value="admin">
            <Tabs defaultValue="rosters" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rosters">User Rosters</TabsTrigger>
                <TabsTrigger value="status">User Status</TabsTrigger>
                <TabsTrigger value="scores">Episode Scores</TabsTrigger>
              </TabsList>

              <TabsContent value="rosters">
                <AdminRosters
                  league={league}
                  adminUserId={user!.id}
                  members={leagueMembers}
                  seasonContestants={seasonContestants}
                  mergeStatus={mergeStatus}
                  maxRosterSize={maxRosterSize}
                  onMergeStatusUpdated={(status) => {
                    setMergeStatus(status);
                    refreshLeaderboard();
                  }}
                />
              </TabsContent>

              <TabsContent value="status">
                <UserStatus
                  league={league}
                  members={leagueMembers}
                  mergeStatus={mergeStatus}
                />
              </TabsContent>

              <TabsContent value="scores">
                <EpisodeScores
                  leagueId={numId}
                  numEpisodes={season.numEpisodes}
                  seasonContestants={seasonContestants}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>

      {/* View-roster modal */}
      <RosterViewModal
        member={viewingMember}
        leagueId={numId}
        seasonContestants={seasonContestants}
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
          seasonContestants={seasonContestants}
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
