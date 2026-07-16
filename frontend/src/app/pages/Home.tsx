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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2">My Leagues</h1>
          <p className="text-muted-foreground">Manage your Survivor fantasy leagues</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={(open) => { setJoinDialogOpen(open); if (!open) setJoinError(""); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
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

          <Link to="/leagues/new">
            <Button className="gap-2">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link key={league.id} to={`/league/${league.id}`}>
              <Card className="transition-all hover:border-primary hover:fire-glow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="mb-1">{league.name}</CardTitle>
                      <CardDescription>{league.seasonName}</CardDescription>
                    </div>
                    <Trophy className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
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
                      className={league.pickingOpen ? "bg-green-500/10 text-green-500 border-green-500" : ""}
                    >
                      {league.pickingOpen ? "Picking Open" : "Picking Closed"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
