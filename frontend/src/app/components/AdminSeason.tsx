import { useState, useEffect, useCallback } from "react";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { EpisodeModal } from "./EpisodeModal";
import {
  setLeagueArchived,
  getEpisodes,
  addEpisode,
  deleteEpisode,
  type LeagueApiResponse,
  type Contestant,
  type Episode,
} from "../../api";

interface Props {
  league: LeagueApiResponse;
  contestants: Contestant[];
  onLeagueUpdated: (league: LeagueApiResponse) => void;
  onContestantsChanged: (contestants: Contestant[]) => void;
  onScoresChanged: () => void;
}

export function AdminSeason({
  league, contestants, onLeagueUpdated, onContestantsChanged, onScoresChanged,
}: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openEpisodeId, setOpenEpisodeId] = useState<number | null>(null);
  const [togglingArchived, setTogglingArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const refreshEpisodes = useCallback(() => {
    getEpisodes(league.id).then(setEpisodes).catch(() => {});
  }, [league.id]);

  useEffect(() => {
    refreshEpisodes();
  }, [refreshEpisodes]);

  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;
  const openEpisode = episodes.find((e) => e.id === openEpisodeId) ?? null;

  const handleToggleArchived = async () => {
    setError("");
    setTogglingArchived(true);
    try {
      onLeagueUpdated(await setLeagueArchived(league.id, !league.archived));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update archived state");
    } finally {
      setTogglingArchived(false);
    }
  };

  const handleAddEpisode = async () => {
    setError("");
    setAdding(true);
    try {
      const episode = await addEpisode(league.id);
      setEpisodes((prev) => [...prev, episode]);
      setOpenEpisodeId(episode.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add episode");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEpisode = async (episode: Episode) => {
    setError("");
    try {
      await deleteEpisode(league.id, episode.id);
      refreshEpisodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove episode");
    }
  };

  const handleEpisodeChanged = (updated: Episode) => {
    // Only one episode can be flagged as the merge episode at a time — the backend
    // already enforces this, but local state needs to reflect the clear too so the
    // previously-flagged episode doesn't keep showing a stale "Merge" tag.
    setEpisodes((prev) =>
      prev.map((e) => {
        if (e.id === updated.id) return updated;
        return updated.isMergeEpisode ? { ...e, isMergeEpisode: false } : e;
      })
    );
    if (updated.isMergeEpisode) {
      onLeagueUpdated({ ...league, mergeEpisode: updated.episodeNumber });
    } else if (league.mergeEpisode === updated.episodeNumber) {
      onLeagueUpdated({ ...league, mergeEpisode: null });
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Episodes ── */}
      <Card style={{ padding: "16px" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Episodes</div>
          <Button size="sm" className="min-h-[36px] gap-1.5" onClick={handleAddEpisode} disabled={adding}>
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding..." : "Add Episode"}
          </Button>
        </div>

        {episodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No episodes yet — add the first one to start entering scores.</p>
        ) : (
          <div>
            {episodes.map((ep, i) => (
              <div
                key={ep.id}
                className={`flex min-h-[44px] cursor-pointer items-center justify-between py-2.5 ${
                  i < episodes.length - 1 ? "border-b border-border" : ""
                }`}
                onClick={() => setOpenEpisodeId(ep.id)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium">Episode {ep.episodeNumber}</span>
                  {ep.isMergeEpisode && <Badge>Merge</Badge>}
                </div>
                <div className="flex items-center gap-2.5">
                  {latestEpisode?.id === ep.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); handleDeleteEpisode(ep); }}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  )}
                  <span className="text-muted-foreground">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Season state ── */}
      <Card style={{ padding: "16px" }}>
        <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Season</div>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm text-muted-foreground">
            Archiving moves this league to "Past seasons" on the home page.
          </span>
          <Button
            variant={league.archived ? "secondary" : "outline"}
            size="sm"
            className="min-h-[36px] shrink-0 gap-1.5"
            onClick={handleToggleArchived}
            disabled={togglingArchived}
          >
            {league.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {league.archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {openEpisode && (
        <EpisodeModal
          leagueId={league.id}
          episode={openEpisode}
          contestants={contestants}
          onClose={() => setOpenEpisodeId(null)}
          onEpisodeChanged={handleEpisodeChanged}
          onContestantsChanged={onContestantsChanged}
          onScoresChanged={onScoresChanged}
        />
      )}
    </div>
  );
}
