import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  getEpisodes,
  addEpisode,
  deleteEpisode,
  getEpisodeScores,
  saveEpisodeScores,
  type Contestant,
  type Episode,
  type EpisodeScoreItem,
} from "../../api";

interface Props {
  leagueId: number;
  adminUserId: number;
  contestants: Contestant[];
}

export function EpisodeScores({ leagueId, adminUserId, contestants }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const refreshEpisodes = useCallback(() => {
    getEpisodes(leagueId).then((list) => {
      setEpisodes(list);
      setSelectedEpisode((current) => {
        if (current !== null && list.some((e) => e.episodeNumber === current)) return current;
        return list.length > 0 ? list[list.length - 1].episodeNumber : null;
      });
    });
  }, [leagueId]);

  useEffect(() => {
    refreshEpisodes();
  }, [refreshEpisodes]);

  useEffect(() => {
    if (selectedEpisode === null) return;
    getEpisodeScores(leagueId, selectedEpisode).then((items) => {
      setScores(Object.fromEntries(items.map((i) => [i.contestantId, i.points])));
      setError("");
      setSuccess(false);
    });
  }, [leagueId, selectedEpisode]);

  const handleAddEpisode = async () => {
    setAdding(true);
    setError("");
    try {
      const episode = await addEpisode(leagueId, adminUserId);
      setEpisodes((prev) => [...prev, episode]);
      setSelectedEpisode(episode.episodeNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add episode");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEpisode = async (episode: Episode) => {
    setError("");
    try {
      await deleteEpisode(leagueId, adminUserId, episode.id);
      refreshEpisodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove episode");
    }
  };

  const handleSave = async () => {
    if (selectedEpisode === null) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const payload: EpisodeScoreItem[] = contestants.map((c) => ({
        contestantId: c.id,
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

  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;
  const selectedIsLatest = latestEpisode !== null && selectedEpisode === latestEpisode.episodeNumber;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          onValueChange={(v) => setSelectedEpisode(Number(v))}
          value={selectedEpisode !== null ? String(selectedEpisode) : ""}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={episodes.length === 0 ? "No episodes yet" : "Select episode"} />
          </SelectTrigger>
          <SelectContent>
            {episodes.map((ep) => (
              <SelectItem key={ep.id} value={String(ep.episodeNumber)}>
                Episode {ep.episodeNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleAddEpisode} disabled={adding} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {adding ? "Adding..." : "Add Episode"}
        </Button>

        {selectedIsLatest && latestEpisode && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1.5"
            onClick={() => handleRemoveEpisode(latestEpisode)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Episode {latestEpisode.episodeNumber}
          </Button>
        )}

        {selectedEpisode !== null && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Scores"}
          </Button>
        )}

        {success && <span className="text-sm text-green-600">Saved!</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      {episodes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No episodes yet. Add the first episode above once it airs to start entering scores.
        </p>
      )}

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
              {contestants.map((contestant, i) => (
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
