import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getSeasonContestants, getSeasons, type Season, type SeasonContestant } from "../../api";

export function SeasonCast() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [contestants, setContestants] = useState<SeasonContestant[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSeasons()
      .then((data) => {
        setSeasons(data);
        if (data.length > 0) {
          const active = data.find((s) => s.status === "ACTIVE") ?? data[0];
          setSelectedSeasonId(active.id.toString());
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedSeasonId) return;
    setLoading(true);
    setError(null);
    getSeasonContestants(Number(selectedSeasonId))
      .then((data) => {
        setContestants(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [selectedSeasonId]);

  const active = contestants.filter((c) => c.eliminatedEpisode === null);
  const eliminated = contestants.filter((c) => c.eliminatedEpisode !== null);

  function fullName(c: SeasonContestant) {
    return `${c.firstName} ${c.lastName}`;
  }

  function ContestantCard({ c }: { c: SeasonContestant }) {
    return (
      <div className="p-4 rounded-lg border bg-card transition-all hover:border-primary">
        {c.imageUrl && (
          <img
            src={c.imageUrl}
            alt={fullName(c)}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <div className="font-semibold mb-1">{fullName(c)}</div>
        {(c.hometown || c.state) && (
          <div className="text-sm text-muted-foreground mb-2">
            {[c.hometown, c.state].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="flex items-center gap-2">
          {c.winner ? (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Winner</Badge>
          ) : c.eliminatedEpisode !== null ? (
            <Badge variant="destructive">Out Ep. {c.eliminatedEpisode}</Badge>
          ) : (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              Active
            </Badge>
          )}
          {c.finishPlace && !c.winner && (
            <span className="text-sm text-muted-foreground">#{c.finishPlace}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2">Season Cast</h1>
            <p className="text-muted-foreground">View all contestants by season</p>
          </div>
          <div className="w-64">
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive mb-6">
          Failed to load data: {error}
        </div>
      )}

      {loading && !error && (
        <div className="text-muted-foreground">Loading contestants...</div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {active.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <CardTitle>Still Playing</CardTitle>
                  <Badge variant="outline">{active.length} remaining</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {active.map((c) => <ContestantCard key={c.id} c={c} />)}
                </div>
              </CardContent>
            </Card>
          )}

          {eliminated.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-600" />
                  <CardTitle>Eliminated</CardTitle>
                  <Badge variant="outline">{eliminated.length} eliminated</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {eliminated.map((c) => <ContestantCard key={c.id} c={c} />)}
                </div>
              </CardContent>
            </Card>
          )}

          {active.length === 0 && eliminated.length === 0 && (
            <div className="text-muted-foreground">No contestants found for this season.</div>
          )}
        </div>
      )}
    </div>
  );
}
