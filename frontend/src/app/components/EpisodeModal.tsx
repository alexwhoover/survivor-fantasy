import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  getEpisodeScores,
  saveEpisodeScores,
  setEpisodeMergeFlag,
  updateContestantStatus,
  type Contestant,
  type Episode,
} from "../../api";

interface Props {
  leagueId: number;
  adminUserId: number;
  episode: Episode;
  contestants: Contestant[];
  onClose: () => void;
  onEpisodeChanged: (episode: Episode) => void;
  onContestantsChanged: (contestants: Contestant[]) => void;
  onScoresChanged: () => void;
}

export function EpisodeModal({
  leagueId, adminUserId, episode, contestants,
  onClose, onEpisodeChanged, onContestantsChanged, onScoresChanged,
}: Props) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [togglingMerge, setTogglingMerge] = useState(false);
  const [error, setError] = useState("");

  const loadScores = useCallback(() => {
    getEpisodeScores(leagueId, episode.episodeNumber).then((items) => {
      setScores(Object.fromEntries(items.map((i) => [i.contestantId, i.points])));
    });
  }, [leagueId, episode.episodeNumber]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const commitScores = async (next: Record<number, number>) => {
    setError("");
    try {
      await saveEpisodeScores(
        leagueId,
        episode.episodeNumber,
        contestants.map((c) => ({ contestantId: c.id, points: next[c.id] ?? 0 }))
      );
      onScoresChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save scores");
    }
  };

  const handleScoreChange = (contestantId: number, value: number) => {
    setScores((prev) => ({ ...prev, [contestantId]: value }));
  };

  const handleScoreBlur = () => {
    commitScores(scores);
  };

  const handleToggleMergeFlag = async () => {
    setTogglingMerge(true);
    setError("");
    try {
      const updated = await setEpisodeMergeFlag(leagueId, adminUserId, episode.id, !episode.isMergeEpisode);
      onEpisodeChanged(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update merge episode flag");
    } finally {
      setTogglingMerge(false);
    }
  };

  const handleToggleEliminated = async (c: Contestant) => {
    const isOutThisEpisode = c.eliminatedEpisode === episode.episodeNumber;
    setError("");
    try {
      const updated = await updateContestantStatus(
        leagueId, adminUserId, c.id,
        isOutThisEpisode ? null : episode.episodeNumber,
        c.winner
      );
      onContestantsChanged(contestants.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update elimination status");
    }
  };

  const handleToggleWinner = async (c: Contestant) => {
    setError("");
    try {
      const updated = await updateContestantStatus(leagueId, adminUserId, c.id, c.eliminatedEpisode, !c.winner);
      onContestantsChanged(contestants.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update winner status");
    }
  };

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[560px] max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Episode {episode.episodeNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <div className="flex items-center justify-between pb-3 mb-1.5 border-b border-border">
            <span className="text-sm text-muted-foreground">Merge Episode</span>
            <Button
              variant={episode.isMergeEpisode ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleMergeFlag}
              disabled={togglingMerge}
            >
              {episode.isMergeEpisode ? "Yes" : "No"}
            </Button>
          </div>

          {contestants.map((c, i) => {
            const isOutThisEpisode = c.eliminatedEpisode === episode.episodeNumber;
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between py-2.5 ${
                  i < contestants.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.tribeColour && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.tribeColour }} />}
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: c.eliminatedEpisode !== null ? "var(--muted-foreground)" : "var(--foreground)" }}
                  >
                    {c.firstName} {c.lastName}
                  </span>
                  {c.tribe && <span className="text-xs text-muted-foreground shrink-0">{c.tribe}</span>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    variant={c.winner ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleToggleWinner(c)}
                  >
                    {c.winner ? "Winner" : "Mark Winner"}
                  </Button>
                  <Button
                    variant={isOutThisEpisode ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => handleToggleEliminated(c)}
                  >
                    {isOutThisEpisode ? "Out" : "Mark Out"}
                  </Button>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-16 h-8 rounded border border-input bg-background px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={scores[c.id] ?? 0}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value) || 0)}
                    onBlur={handleScoreBlur}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
