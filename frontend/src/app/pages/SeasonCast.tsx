import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getSeasonContestants, getSeasons, type Season, type SeasonContestant } from "../../api";

const MEDAL = {
  1: {
    border: "border-yellow-400",
    bg: "bg-yellow-500/10",
    label: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    place: "1st — Winner",
  },
  2: {
    border: "border-slate-400",
    bg: "bg-slate-400/10",
    label: "text-slate-400",
    badge: "bg-slate-400/20 text-slate-400 border-slate-400",
    place: "2nd — Runner-up",
  },
  3: {
    border: "border-amber-600",
    bg: "bg-amber-600/10",
    label: "text-amber-600",
    badge: "bg-amber-600/20 text-amber-600 border-amber-600",
    place: "3rd Place",
  },
} as const;

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

  const selectedSeason = seasons.find((s) => s.id.toString() === selectedSeasonId);
  const isCompleted = selectedSeason?.status === "COMPLETED";

  const sortedByFinish = [...contestants].sort((a, b) => {
    if (a.finishPlace === null && b.finishPlace === null) return 0;
    if (a.finishPlace === null) return 1;
    if (b.finishPlace === null) return -1;
    return a.finishPlace - b.finishPlace;
  });

  const active = contestants.filter((c) => c.eliminatedEpisode === null);
  const eliminated = contestants.filter((c) => c.eliminatedEpisode !== null);

  function fullName(c: SeasonContestant) {
    return `${c.firstName} ${c.lastName}`;
  }

  function ordinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  }

  function ActiveContestantCard({ c }: { c: SeasonContestant }) {
    return (
      <div className="p-4 rounded-lg border bg-card transition-all hover:border-primary">
        {c.imageUrl && (
          <img src={c.imageUrl} alt={fullName(c)} className="w-full h-32 object-cover rounded-md mb-3" />
        )}
        <div className="font-semibold mb-1">{fullName(c)}</div>
        {(c.hometown || c.state) && (
          <div className="text-sm text-muted-foreground mb-2">
            {[c.hometown, c.state].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="flex items-center gap-2">
          {c.eliminatedEpisode !== null ? (
            <Badge variant="destructive">Out Ep. {c.eliminatedEpisode}</Badge>
          ) : (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              Active
            </Badge>
          )}
        </div>
      </div>
    );
  }

  function CompletedContestantCard({ c }: { c: SeasonContestant }) {
    const place = c.finishPlace;
    const medal = place !== null && place in MEDAL ? MEDAL[place as keyof typeof MEDAL] : null;

    return (
      <div
        className={[
          "p-4 rounded-lg border bg-card transition-all hover:border-primary",
          medal ? `${medal.border} ${medal.bg}` : "",
        ].join(" ")}
      >
        {c.imageUrl && (
          <img src={c.imageUrl} alt={fullName(c)} className="w-full h-32 object-cover rounded-md mb-3" />
        )}
        <div className="font-semibold mb-1">{fullName(c)}</div>
        {(c.hometown || c.state) && (
          <div className="text-sm text-muted-foreground mb-2">
            {[c.hometown, c.state].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {medal ? (
            <Badge className={medal.badge}>{medal.place}</Badge>
          ) : place !== null ? (
            <span className="text-sm text-muted-foreground">{ordinal(place)}</span>
          ) : null}
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

      {!loading && !error && contestants.length === 0 && (
        <div className="text-muted-foreground">No contestants found for this season.</div>
      )}

      {!loading && !error && contestants.length > 0 && (
        isCompleted ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedByFinish.map((c) => <CompletedContestantCard key={c.id} c={c} />)}
          </div>
        ) : (
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
                    {active.map((c) => <ActiveContestantCard key={c.id} c={c} />)}
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
                    {eliminated.map((c) => <ActiveContestantCard key={c.id} c={c} />)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}
    </div>
  );
}
