import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Crown, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { getLeagueById, getSeasonContestants, getSeasonById, getMyRoster, getLeagueMembers, getMyLeagueRole, type LeagueApiResponse, type Season, type SeasonContestant, type RosterResponse, type LeagueMember } from "../../api";
import { EpisodeScores } from "./EpisodeScores";

export function LeagueOverview() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [seasonContestants, setSeasonContestants] = useState<SeasonContestant[]>([]);
  const [myRoster, setMyRoster] = useState<RosterResponse | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<LeagueMember | null>(null);
  const [myRole, setMyRole] = useState<"ADMIN" | "MEMBER" | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    const id = Number(leagueId);
    getLeagueById(id).then((l) => {
      setLeague(l);
      getSeasonContestants(l.seasonId).then(setSeasonContestants);
      getSeasonById(l.seasonId).then(setSeason);
    });
    getLeagueMembers(id).then(setLeagueMembers);
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !user) return;
    const id = Number(leagueId);
    getMyRoster(id, user.id).then(setMyRoster);
    getMyLeagueRole(id, user.id).then(setMyRole);
  }, [leagueId, user]);

  if (!league) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const myRosterContestants = myRoster
    ? myRoster.seasonContestantIds.map((id) => seasonContestants.find((c) => c.id === id)).filter(Boolean) as SeasonContestant[]
    : [];
  const mvpContestant = myRoster ? seasonContestants.find((c) => c.id === myRoster.mvpSeasonContestantId) ?? null : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2">{league.name}</h1>
          </div>
          <Link to={`/league/${leagueId}/pick`}>
            <Button>{myRoster ? "Edit Roster" : "Make Picks"}</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">League Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leagueMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">League Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold">{league.code}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="roster" className="space-y-6">
        <TabsList className={`grid w-full ${myRole === "ADMIN" ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="roster">My Roster</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          {myRole === "ADMIN" && <TabsTrigger value="scores">Episode Scores</TabsTrigger>}
        </TabsList>

        <TabsContent value="roster" className="space-y-6">
          {selectedMember && (
            <div className="flex items-center justify-between">
              <h2>{selectedMember.username}'s Roster</h2>
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                Back to My Roster
              </Button>
            </div>
          )}

          {selectedMember ? (
            <Card>
              <CardHeader>
                <CardTitle>Roster Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Full standings view coming soon.</p>
              </CardContent>
            </Card>
          ) : myRoster ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roster Details</CardTitle>
                    <CardDescription>Your picked contestants</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRosterContestants.map((contestant) => {
                    const isMVP = contestant.id === myRoster.mvpSeasonContestantId;
                    return (
                      <div
                        key={contestant.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {isMVP && <Crown className="h-5 w-5 text-primary" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{contestant.firstName} {contestant.lastName}</span>
                              {isMVP && <Badge variant="outline">MVP</Badge>}
                              {contestant.eliminatedEpisode !== null && (
                                <Badge variant="destructive">Eliminated</Badge>
                              )}
                            </div>
                            {contestant.tribe && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                {contestant.tribeColour && (
                                  <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: contestant.tribeColour }} />
                                )}
                                {contestant.tribe} Tribe
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {mvpContestant && (
                  <div className="mt-6 p-4 rounded-lg bg-accent border border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="font-semibold">MVP: {mvpContestant.firstName} {mvpContestant.lastName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your MVP pick. Bonus points if they win the season!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't submitted your picks yet.</p>
                <Link to={`/league/${leagueId}/pick`}>
                  <Button>Make Picks</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Standings</CardTitle>
              <CardDescription>Current rankings for {league.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {leagueMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No members yet.</p>
              ) : (
                <div className="space-y-3">
                  {leagueMembers.map((member, index) => {
                    const isCurrentUser = user && member.userId === user.id;
                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCurrentUser ? "bg-accent border-primary" : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{member.username}</span>
                            {isCurrentUser && <Badge variant="outline">You</Badge>}
                            {member.role === "ADMIN" && <Badge variant="outline">Admin</Badge>}
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedMember(member)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {myRole === "ADMIN" && season && (
          <TabsContent value="scores">
            <EpisodeScores
              leagueId={Number(leagueId)}
              numEpisodes={season.numEpisodes}
              seasonContestants={seasonContestants}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
