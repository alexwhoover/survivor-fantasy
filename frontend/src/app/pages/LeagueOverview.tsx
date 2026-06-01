import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Crown, Users, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { calculateRosterPoints } from "../data/mockData";
import {
  getLeague,
  getLeagueRosters,
  getMyRoster,
  getContestants,
  type League,
  type Contestant,
  type UserRoster,
} from "../../api";

export function LeagueOverview() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState<League | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [allRosters, setAllRosters] = useState<UserRoster[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRoster | null>(null);
  const [selectedRoster, setSelectedRoster] = useState<UserRoster | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    Promise.all([
      getLeague(leagueId),
      getLeagueRosters(leagueId),
      getMyRoster(leagueId),
    ]).then(([leagueData, rosters, myRosterData]) => {
      setLeague(leagueData);
      setAllRosters(rosters);
      setCurrentUser(myRosterData);
      if (leagueData) {
        getContestants(leagueData.season).then(setContestants);
      }
    });
  }, [leagueId]);

  if (!league || !currentUser) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const rankedRosters = allRosters
    .map((r) => ({ ...r, totalPoints: calculateRosterPoints(r, contestants) }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const myPoints = calculateRosterPoints(currentUser, contestants);
  const myRank = rankedRosters.findIndex((r) => r.userId === currentUser.userId) + 1;

  const viewingRoster = selectedRoster ?? currentUser;
  const viewingPoints = calculateRosterPoints(viewingRoster, contestants);
  const rosterContestants = viewingRoster.contestants
    .map((id) => contestants.find((c) => c.id === id))
    .filter(Boolean) as Contestant[];
  const mvpContestant = contestants.find((c) => c.id === viewingRoster.mvpId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2">{league.name}</h1>
            <p className="text-muted-foreground">Season {league.season} - Episode {league.currentEpisode}</p>
          </div>
          <Link to={`/league/${leagueId}/pick`}>
            <Button>Edit Roster</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Your Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">#{myRank}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Your Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{myPoints}</div>
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roster Details</CardTitle>
                  <CardDescription>Your picked contestants and their performance</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Points</div>
                  <div className="text-3xl font-bold text-primary">{viewingPoints}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rosterContestants.map((contestant) => {
                  const isMVP = contestant.id === viewingRoster.mvpId;
                  const contestantPoints = Object.values(contestant.episodePoints).reduce(
                    (sum, pts) => sum + pts,
                    0
                  );

                  return (
                    <div
                      key={contestant.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {isMVP && <Crown className="h-5 w-5 text-primary" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{contestant.name}</span>
                            {isMVP && <Badge variant="outline">MVP</Badge>}
                            {contestant.eliminated && (
                              <Badge variant="destructive">Eliminated</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{contestant.tribe} Tribe</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{contestantPoints}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {mvpContestant && (
                <div className="mt-6 p-4 rounded-lg bg-accent border border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span className="font-semibold">MVP Bonus</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If {mvpContestant.name} wins the season, you'll earn an additional{" "}
                    <span className="font-bold text-primary">{league.mvpBonus} points</span>!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Standings</CardTitle>
              <CardDescription>Current rankings for {league.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankedRosters.map((roster, index) => {
                  const isCurrentUser = roster.userId === currentUser.userId;

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
                          <div className="text-sm text-muted-foreground">
                            {roster.contestants.length} contestants
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{roster.totalPoints}</div>
                          <div className="text-xs text-muted-foreground">points</div>
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
