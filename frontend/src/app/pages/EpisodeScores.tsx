import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getEpisodeScores, saveEpisodeScores, type SeasonContestant, type EpisodeScoreItem } from "../../api";

interface Props {
  leagueId: number;
  numEpisodes: number;
  seasonContestants: SeasonContestant[];
}

export function EpisodeScores({ leagueId, numEpisodes, seasonContestants }: Props) {
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedEpisode === null) return;
    getEpisodeScores(leagueId, selectedEpisode).then((items) => {
      setScores(Object.fromEntries(items.map((i) => [i.seasonContestantId, i.points])));
      setError("");
      setSuccess(false);
    });
  }, [leagueId, selectedEpisode]);

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
      await saveEpisodeScores(leagueId, selectedEpisode, payload);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Contestant</th>
                <th className="px-4 py-2 text-right font-medium w-32">Points</th>
              </tr>
            </thead>
            <tbody>
              {seasonContestants.map((contestant, i) => (
                <tr key={contestant.id} className={i % 2 === 0 ? "" : "bg-muted/25"}>
                  <td className="px-4 py-1.5">
                    {contestant.firstName} {contestant.lastName}
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-20 rounded border border-input bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={scores[contestant.id] ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [contestant.id]: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
