import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Crown, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import {
  getLeagueById,
  getSeasonContestants,
  getMyRoster,
  submitRoster,
  type LeagueApiResponse,
  type SeasonContestant,
} from "../../api";

export function RosterPicker() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueApiResponse | null>(null);
  const [contestants, setContestants] = useState<SeasonContestant[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [mvpId, setMvpId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leagueId) return;
    getLeagueById(Number(leagueId))
      .then((l) => {
        setLeague(l);
        return getSeasonContestants(l.seasonId);
      })
      .then(setContestants);
  }, [leagueId]);

  useEffect(() => {
    if (!leagueId || !user) return;
    getMyRoster(Number(leagueId), user.id).then((r) => {
      if (r) {
        setSelectedIds(r.seasonContestantIds);
        setMvpId(r.mvpSeasonContestantId);
      }
    });
  }, [leagueId, user]);

  useEffect(() => {
    if (!league?.pickDeadline) return;
    const deadline = new Date(league.pickDeadline);
    const updateCountdown = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Deadline passed"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [league]);

  if (!league || !user) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const tribes = [...new Set(contestants.map((c) => c.tribe).filter(Boolean) as string[])];
  const tribeColorMap = Object.fromEntries(
    tribes.map((t) => [t, contestants.find((c) => c.tribe === t)?.tribeColour ?? '#6B7280'])
  );

  const activeByTribe = (tribe: string) => contestants.filter((c) => c.tribe === tribe && c.eliminatedEpisode === null);
  const countByTribe = (tribe: string) => selectedIds.filter((id) => contestants.find((c) => c.id === id)?.tribe === tribe).length;

  const handleToggle = (id: number) => {
    const contestant = contestants.find((c) => c.id === id);
    if (!contestant) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
      if (mvpId === id) setMvpId(null);
    } else if (countByTribe(contestant.tribe!) < league.contestantsPerTribe) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmit = async () => {
    if (!mvpId) return;
    setSubmitting(true);
    setError("");
    try {
      await submitRoster(Number(leagueId), user.id, selectedIds, mvpId);
      navigate(`/league/${leagueId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit roster");
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = selectedIds.length === league.contestantsPerTribe * tribes.length && mvpId !== null;
  const mvpName = mvpId ? contestants.find((c) => c.id === mvpId) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2">Pick Your Roster</h1>
            <p className="text-muted-foreground">{league.name}</p>
          </div>
          {league.pickDeadline && (
            <Card className="bg-accent border-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Deadline</div>
                    <div className="font-semibold text-primary">{timeLeft}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Selected:</span>{" "}
                <span className="font-semibold">{selectedIds.length} / {league.contestantsPerTribe * tribes.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">MVP:</span>{" "}
                <span className="font-semibold">
                  {mvpName ? `${mvpName.firstName} ${mvpName.lastName}` : "Not selected"}
                </span>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleSubmit} disabled={!isComplete || submitting} className="gap-2">
                {submitting ? "Submitting..." : "Submit Roster"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {tribes.map((tribe) => {
          const tribeContestants = activeByTribe(tribe);
          const selectionCount = countByTribe(tribe);

          return (
            <Card key={tribe}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tribeColorMap[tribe] }} />
                  <CardTitle>{tribe} Tribe</CardTitle>
                  <Badge variant="outline">
                    {selectionCount} / {league.contestantsPerTribe} selected
                  </Badge>
                </div>
                <CardDescription>
                  Select {league.contestantsPerTribe} contestant{league.contestantsPerTribe > 1 ? "s" : ""} from this tribe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tribeContestants.map((contestant) => {
                    const isSelected = selectedIds.includes(contestant.id);
                    const isMVP = mvpId === contestant.id;

                    return (
                      <div
                        key={contestant.id}
                        className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected ? "border-primary bg-accent" : "border-border hover:border-muted-foreground"
                        }`}
                        onClick={() => handleToggle(contestant.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{contestant.firstName} {contestant.lastName}</span>
                              {isMVP && <Crown className="h-4 w-4 text-primary" />}
                            </div>
                            {contestant.hometown && (
                              <div className="text-xs text-muted-foreground">
                                {contestant.hometown}{contestant.state ? `, ${contestant.state}` : ""}
                              </div>
                            )}
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        {isSelected && !isMVP && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full gap-2"
                            onClick={(e) => { e.stopPropagation(); setMvpId(contestant.id); }}
                          >
                            <Crown className="h-3 w-3" />
                            Set as MVP
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
