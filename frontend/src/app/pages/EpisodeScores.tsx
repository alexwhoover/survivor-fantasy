import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { getEpisodeScores, saveEpisodeScores, type SeasonContestant, type EpisodeScoreItem } from "../../api";

interface Props {
  seasonId: number;
  numEpisodes: number;
  seasonContestants: SeasonContestant[];
}

export function EpisodeScores({ seasonId, numEpisodes, seasonContestants }: Props) {
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedEpisode === null) return;
    getEpisodeScores(seasonId, selectedEpisode).then((items) => {
      setScores(Object.fromEntries(items.map((i) => [i.seasonContestantId, i.points])));
      setError("");
      setSuccess(false);
    });
  }, [seasonId, selectedEpisode]);

  const handleSave = async () => {
    if (selectedEpisode === null) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const payload: EpisodeScoreItem[] = seasonContestants.map((c) => ({
        seasonContestantId: c.id,
        points: scores[c.id] ?? 0,
      }));
      await saveEpisodeScores(seasonId, selectedEpisode, payload);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  const tribes = [...new Set(seasonContestants.map((c) => c.tribe).filter(Boolean) as string[])];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          onValueChange={(v) => setSelectedEpisode(Number(v))}
          value={selectedEpisode !== null ? String(selectedEpisode) : ""}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select episode" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: numEpisodes }, (_, i) => i + 1).map((ep) => (
              <SelectItem key={ep} value={String(ep)}>
                Episode {ep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEpisode !== null && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Scores"}
          </Button>
        )}

        {success && <span className="text-sm text-green-600">Saved!</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      {selectedEpisode !== null && (
        <div className="space-y-4">
          {tribes.map((tribe) => {
            const tribeContestants = seasonContestants.filter((c) => c.tribe === tribe);
            const tribeColour = tribeContestants[0]?.tribeColour ?? "#6B7280";

            return (
              <Card key={tribe}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tribeColour }} />
                    <CardTitle className="text-base">{tribe} Tribe</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {tribeContestants.map((contestant) => (
                      <div key={contestant.id} className="flex items-center gap-3">
                        <span className="flex-1 text-sm font-medium">
                          {contestant.firstName} {contestant.lastName}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          className="w-20 text-center"
                          value={scores[contestant.id] ?? 0}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [contestant.id]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
