import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, LogIn, Trophy, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { EmberBackground } from "../components/EmberBackground";
import { getMyLeagues, joinLeague, type LeagueApiResponse } from "../../api";

export function Home() {
  // RequireAuth guarantees a valid user by the time this page can render.
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<LeagueApiResponse[]>([]);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (user) getMyLeagues(user.id).then(setLeagues);
  }, [user]);

  if (!user) return null;

  const activeLeagues = leagues.filter((l) => !l.archived);
  const archivedLeagues = leagues.filter((l) => l.archived);

  const handleJoinLeague = async () => {
    setJoinError("");
    if (!joinCode.trim()) {
      setJoinError("League code is required");
      return;
    }
    try {
      const league = await joinLeague(joinCode.trim(), user.id);
      setLeagues((prev) => [...prev, league]);
      setJoinDialogOpen(false);
      setJoinCode("");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join league");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <EmberBackground />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
        <div className="text-center md:text-left">
          <h1 className="mb-2">My Leagues</h1>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Dialog open={joinDialogOpen} onOpenChange={(open) => { setJoinDialogOpen(open); if (!open) setJoinError(""); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full min-h-[44px] gap-2 md:w-auto md:min-h-0">
                <LogIn className="h-4 w-4" />
                Join League
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a League</DialogTitle>
                <DialogDescription>
                  Enter the league code provided by your league organizer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">League Code</Label>
                  <Input
                    id="join-code"
                    placeholder="e.g., 5TSTNL"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                {joinError && <p className="text-sm text-destructive">{joinError}</p>}
                <Button onClick={handleJoinLeague} className="w-full">
                  Join League
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Link to="/leagues/new" className="w-full md:w-auto">
            <Button className="w-full min-h-[44px] gap-2 md:w-auto md:min-h-0">
              <Plus className="h-4 w-4" />
              Create League
            </Button>
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground mb-2">You're not in any leagues yet.</p>
          <p className="text-sm text-muted-foreground">Create a new league or join one with a code.</p>
        </div>
      ) : (
        <>
          <LeagueGrid leagues={activeLeagues} />
          {archivedLeagues.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-sm text-muted-foreground uppercase tracking-wide">Archived</h2>
              <LeagueGrid leagues={archivedLeagues} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeagueGrid({ leagues }: { leagues: LeagueApiResponse[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {leagues.map((league) => (
        <Link key={league.id} to={`/league/${league.id}`}>
          <Card className="transition-all hover:border-primary hover:fire-glow cursor-pointer h-full">
            <CardHeader>
              <div className="flex flex-col items-center text-center gap-2 md:flex-row md:items-start md:justify-between md:text-left md:gap-0">
                <div>
                  <CardTitle className="mb-1">{league.name}</CardTitle>
                  <CardDescription>{league.seasonName}</CardDescription>
                </div>
                <Trophy className="h-5 w-5 text-primary shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="hidden md:block">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{league.contestantsPerTribe} per tribe</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Code: </span>
                  <span className="font-mono text-primary">{league.code}</span>
                </div>
                <Badge
                  variant="outline"
                  className={league.initialPicksOpen ? "bg-green-500/10 text-green-500 border-green-500" : ""}
                >
                  {league.initialPicksOpen ? "Picking Open" : "Picking Closed"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
