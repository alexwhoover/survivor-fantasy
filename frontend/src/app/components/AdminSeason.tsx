import { useState, useEffect, useCallback } from "react";
import { Archive, ArchiveRestore, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { EpisodeModal } from "./EpisodeModal";
import {
  setInitialPicksOpen,
  setMergePicksOpen,
  setLeagueArchived,
  getEpisodes,
  addEpisode,
  deleteEpisode,
  type LeagueApiResponse,
  type Tribe,
  type Contestant,
  type Episode,
} from "../../api";

interface Props {
  league: LeagueApiResponse;
  adminUserId: number;
  tribes: Tribe[];
  contestants: Contestant[];
  onLeagueUpdated: (league: LeagueApiResponse) => void;
  onContestantsChanged: (contestants: Contestant[]) => void;
  onMergeStatusChanged: () => void;
  onScoresChanged: () => void;
}

export function AdminSeason({
  league, adminUserId, contestants,
  onLeagueUpdated, onContestantsChanged, onMergeStatusChanged, onScoresChanged,
}: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [openEpisodeId, setOpenEpisodeId] = useState<number | null>(null);
  const [togglingInitial, setTogglingInitial] = useState(false);
  const [togglingMerge, setTogglingMerge] = useState(false);
  const [togglingArchived, setTogglingArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const refreshEpisodes = useCallback(() => {
    getEpisodes(league.id).then(setEpisodes);
  }, [league.id]);

  useEffect(() => {
    refreshEpisodes();
  }, [refreshEpisodes]);

  const mergeEpisodeFlagged = episodes.some((e) => e.isMergeEpisode);
  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;
  const openEpisode = episodes.find((e) => e.id === openEpisodeId) ?? null;

  const handleToggleInitial = async () => {
    setError("");
    setTogglingInitial(true);
    try {
      const updated = await setInitialPicksOpen(league.id, adminUserId, !league.initialPicksOpen);
      onLeagueUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update initial picks state");
    } finally {
      setTogglingInitial(false);
    }
  };

  const handleToggleMerge = async () => {
    setError("");
    setTogglingMerge(true);
    try {
      const updated = await setMergePicksOpen(league.id, adminUserId, !league.mergePicksOpen);
      onLeagueUpdated(updated);
      onMergeStatusChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update merge picks state");
    } finally {
      setTogglingMerge(false);
    }
  };

  const handleToggleArchived = async () => {
    setError("");
    setTogglingArchived(true);
    try {
      const updated = await setLeagueArchived(league.id, adminUserId, !league.archived);
      onLeagueUpdated(updated);
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
      const episode = await addEpisode(league.id, adminUserId);
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
      await deleteEpisode(league.id, adminUserId, episode.id);
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
    onMergeStatusChanged();
  };

  return (
    <div className="space-y-4">
      {/* ── Season Controls ── */}
      <Card style={{ padding: "16px" }}>
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Season Controls</div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Initial Picks</span>
          <Button
            variant={league.initialPicksOpen ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={handleToggleInitial}
            disabled={togglingInitial}
          >
            {league.initialPicksOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {league.initialPicksOpen ? "Open" : "Closed"}
          </Button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Merge Picks</span>
          <Button
            variant={league.mergePicksOpen ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={handleToggleMerge}
            disabled={togglingMerge || !mergeEpisodeFlagged}
            title={!mergeEpisodeFlagged ? "Flag an episode as the merge episode first" : undefined}
          >
            {league.mergePicksOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {league.mergePicksOpen ? "Open" : "Closed"}
          </Button>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Archive League</span>
          <Button
            variant={league.archived ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={handleToggleArchived}
            disabled={togglingArchived}
          >
            {league.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {league.archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </Card>

      {/* ── Episodes ── */}
      <Card style={{ padding: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Episodes</div>
          <Button size="sm" className="gap-1.5" onClick={handleAddEpisode} disabled={adding}>
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
                className={`flex items-center justify-between py-2.5 cursor-pointer ${
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
                      className="h-7 px-2 text-xs text-muted-foreground gap-1"
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      {openEpisode && (
        <EpisodeModal
          leagueId={league.id}
          adminUserId={adminUserId}
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
