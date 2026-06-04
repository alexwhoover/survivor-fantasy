import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, LogIn, Trophy, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getMyLeagues, createLeague, joinLeague, getSeasons, type LeagueApiResponse, type Season } from "../../api";

export function Home() {
  const { user, loading } = useAuth();
  const [leagues, setLeagues] = useState<LeagueApiResponse[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [pickDeadline, setPickDeadline] = useState("");
  const [contestantsPerTribe, setContestantsPerTribe] = useState("2");
  const [joinCode, setJoinCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (user) getMyLeagues(user.id).then(setLeagues);
  }, [user]);

  useEffect(() => {
    getSeasons().then(setSeasons).catch(() => {});
  }, []);

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
    setCreateError("");
    if (!leagueName.trim()) {
      setCreateError("League name is required");
      return;
    }
    if (!selectedSeasonId) {
      setCreateError("Please select a season");
      return;
    }
    if (!pickDeadline) {
      setCreateError("Pick deadline is required");
      return;
    }
    const perTribe = Number(contestantsPerTribe);
    if (!perTribe || perTribe < 1 || perTribe > 10) {
      setCreateError("Contestants per tribe must be between 1 and 10");
      return;
    }
    try {
      // datetime-local gives "YYYY-MM-DDTHH:mm", backend expects ISO LocalDateTime
      const league = await createLeague(
        leagueName.trim(),
        Number(selectedSeasonId),
        user.id,
        pickDeadline,
        perTribe
      );
      setLeagues((prev) => [...prev, league]);
      setCreateDialogOpen(false);
      setLeagueName("");
      setSelectedSeasonId("");
      setPickDeadline("");
      setContestantsPerTribe("2");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create league");
    }
  };

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

  const getSeasonName = (seasonId: number) => {
    const season = seasons.find((s) => s.id === seasonId);
    return season ? season.name : `Season ${seasonId}`;
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) setCreateError(""); }}>
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
                <div className="space-y-2">
                  <Label htmlFor="season-select">Season</Label>
                  <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                    <SelectTrigger id="season-select">
                      <SelectValue placeholder="Select a season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={String(season.id)}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pick-deadline">Pick Deadline</Label>
                  <Input
                    id="pick-deadline"
                    type="datetime-local"
                    value={pickDeadline}
                    onChange={(e) => setPickDeadline(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Members cannot change their roster after this date and time
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contestants-per-tribe">Contestants Per Tribe</Label>
                  <Input
                    id="contestants-per-tribe"
                    type="number"
                    min={1}
                    max={10}
                    value={contestantsPerTribe}
                    onChange={(e) => setContestantsPerTribe(e.target.value)}
                  />
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <Button onClick={handleCreateLeague} className="w-full">
                  Create League
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                      <CardDescription>{getSeasonName(league.seasonId)}</CardDescription>
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
                    {league.pickDeadline && (
                      <div className="text-muted-foreground">
                        Picks due {formatDeadline(league.pickDeadline)}
                      </div>
                    )}
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
