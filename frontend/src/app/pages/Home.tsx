import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, LogIn, Trophy, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getMyLeagues, createLeague, joinLeague, type League } from "../../api";

export function Home() {
  const { user, loading } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user) getMyLeagues().then(setLeagues);
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <Trophy className="h-16 w-16 text-primary mx-auto mb-6 opacity-60" />
        <h1 className="mb-4">My Leagues</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sign in to view and manage your Survivor fantasy leagues.
        </p>
        <Link to="/login">
          <Button size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </Link>
        <Link to="/" className="block mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">
          Learn more about Survivor Fantasy
        </Link>
      </div>
    );
  }

  const handleCreateLeague = async () => {
    const league = await createLeague(leagueName);
    setLeagues((prev) => [...prev, league]);
    setCreateDialogOpen(false);
    setLeagueName("");
  };

  const handleJoinLeague = async () => {
    const league = await joinLeague(joinCode);
    setLeagues((prev) => [...prev, league]);
    setJoinDialogOpen(false);
    setJoinCode("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2">My Leagues</h1>
          <p className="text-muted-foreground">Manage your Survivor fantasy leagues</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
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
                    placeholder="e.g., TORCH47"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <Button onClick={handleJoinLeague} className="w-full">
                  Join League
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New League</DialogTitle>
                <DialogDescription>
                  Start a new Survivor fantasy league and invite your friends
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="league-name">League Name</Label>
                  <Input
                    id="league-name"
                    placeholder="e.g., Office Survivor League"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateLeague} className="w-full">
                  Create League
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <Link key={league.id} to={`/league/${league.id}`}>
            <Card className="transition-all hover:border-primary hover:fire-glow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-1">{league.name}</CardTitle>
                    <CardDescription>Season {league.season}</CardDescription>
                  </div>
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>4 members</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Episode:</span>{" "}
                    <span className="text-foreground font-medium">{league.currentEpisode}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">League Code:</span>{" "}
                    <span className="font-mono text-primary">{league.code}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
