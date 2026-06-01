import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Crown, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { getLeague, getContestants, submitRoster, type League, type Contestant } from "../../api";

export function RosterPicker() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState<League | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [selectedContestants, setSelectedContestants] = useState<string[]>([]);
  const [mvpId, setMvpId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!leagueId) return;
    getLeague(leagueId).then((leagueData) => {
      setLeague(leagueData);
      if (leagueData) {
        getContestants(leagueData.season).then(setContestants);
      }
    });
  }, [leagueId]);

  useEffect(() => {
    if (!league) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = league.pickDeadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [league]);

  if (!league) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const tribes = [...new Set(contestants.map((c) => c.tribe))];
  const getContestantsByTribe = (tribe: string) =>
    contestants.filter((c) => c.tribe === tribe && !c.eliminated);

  const getSelectionCountByTribe = (tribe: string) =>
    selectedContestants.filter((id) => {
      const contestant = contestants.find((c) => c.id === id);
      return contestant?.tribe === tribe;
    }).length;

  const canSelectFromTribe = (tribe: string) =>
    getSelectionCountByTribe(tribe) < league.contestantsPerTribe;

  const handleToggleContestant = (contestantId: string) => {
    const contestant = contestants.find((c) => c.id === contestantId);
    if (!contestant) return;

    if (selectedContestants.includes(contestantId)) {
      setSelectedContestants(selectedContestants.filter((id) => id !== contestantId));
      if (mvpId === contestantId) setMvpId("");
    } else {
      if (canSelectFromTribe(contestant.tribe)) {
        setSelectedContestants([...selectedContestants, contestantId]);
      }
    }
  };

  const handleSetMVP = (contestantId: string) => {
    if (selectedContestants.includes(contestantId)) {
      setMvpId(contestantId);
    }
  };

  const handleSubmit = async () => {
    await submitRoster(leagueId!, selectedContestants, mvpId);
    navigate(`/league/${leagueId}`);
  };

  const isComplete = selectedContestants.length === league.contestantsPerTribe * tribes.length && mvpId;

  const tribeColors: Record<string, string> = {
    Gata: "bg-red-600",
    Lavo: "bg-yellow-600",
    Tuku: "bg-blue-600",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2">Pick Your Roster</h1>
            <p className="text-muted-foreground">{league.name} - Season {league.season}</p>
          </div>
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
        </div>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Selected:</span>{" "}
                <span className="font-semibold">{selectedContestants.length} / {league.contestantsPerTribe * tribes.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">MVP:</span>{" "}
                <span className="font-semibold">{mvpId ? contestants.find((c) => c.id === mvpId)?.name : "Not selected"}</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!isComplete}
                className="gap-2"
              >
                Submit Roster
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {tribes.map((tribe) => {
          const tribeContestants = getContestantsByTribe(tribe);
          const selectionCount = getSelectionCountByTribe(tribe);

          return (
            <Card key={tribe}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${tribeColors[tribe] ?? "bg-gray-600"}`} />
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
                    const isSelected = selectedContestants.includes(contestant.id);
                    const isMVP = mvpId === contestant.id;

                    return (
                      <div
                        key={contestant.id}
                        className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-accent"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        onClick={() => handleToggleContestant(contestant.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{contestant.name}</span>
                              {isMVP && <Crown className="h-4 w-4 text-primary" />}
                            </div>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMVP(contestant.id);
                            }}
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
