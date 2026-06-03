import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Crown, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { getLeagueById, getSeasonContestants, getMyRoster, getLeagueRosters, type LeagueApiResponse, type SeasonContestant, type RosterResponse, type UserRoster } from "../../api";

export function LeagueOverview() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [seasonContestants, setSeasonContestants] = useState<SeasonContestant[]>([]);
  const [myRoster, setMyRoster] = useState<RosterResponse | null>(null);
  const [allRosters, setAllRosters] = useState<UserRoster[]>([]);
  const [selectedRoster, setSelectedRoster] = useState<UserRoster | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    const id = Number(leagueId);
    getLeagueById(id).then((l) => {
      setLeague(l);
      getSeasonContestants(l.seasonId).then(setSeasonContestants);
    });
    getLeagueRosters(leagueId).then(setAllRosters);
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !user) return;
    getMyRoster(Number(leagueId), user.id).then(setMyRoster);
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
              <div className="text-3xl font-bold">{allRosters.length}</div>
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roster">My Roster</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-6">
          {selectedRoster && (
            <div className="flex items-center justify-between">
              <h2>{selectedRoster.userName}'s Roster</h2>
              <Button variant="outline" onClick={() => setSelectedRoster(null)}>
                Back to My Roster
              </Button>
            </div>
          )}

          {selectedRoster ? (
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
                              <div className="text-sm text-muted-foreground">{contestant.tribe} Tribe</div>
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
              {allRosters.length === 0 ? (
                <p className="text-muted-foreground text-sm">No standings yet.</p>
              ) : (
                <div className="space-y-3">
                  {allRosters.map((roster, index) => {
                    const isCurrentUser = user && String(roster.userId) === String(user.id);
                    return (
                      <div
                        key={roster.userId}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCurrentUser ? "bg-accent border-primary" : "bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{roster.userName}</span>
                              {isCurrentUser && <Badge variant="outline">You</Badge>}
                            </div>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedRoster(roster)}
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
      </Tabs>
    </div>
  );
}
