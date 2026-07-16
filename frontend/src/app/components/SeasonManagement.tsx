import { useState } from "react";
import { Lock, Save, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { setPicking, updateContestantStatus, type LeagueApiResponse, type Tribe, type Contestant } from "../../api";

interface Props {
  league: LeagueApiResponse;
  adminUserId: number;
  tribes: Tribe[];
  contestants: Contestant[];
  onLeagueUpdated: (league: LeagueApiResponse) => void;
  onContestantsChanged: (contestants: Contestant[]) => void;
}

interface StatusForm {
  eliminatedEpisode: string;
  winner: boolean;
}

export function SeasonManagement({
  league, adminUserId, tribes, contestants, onLeagueUpdated, onContestantsChanged,
}: Props) {
  const [togglingPicking, setTogglingPicking] = useState(false);
  const [pickingError, setPickingError] = useState("");

  const [edits, setEdits] = useState<Record<number, StatusForm>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState("");

  const handleTogglePicking = async () => {
    setPickingError("");
    setTogglingPicking(true);
    try {
      const updated = await setPicking(league.id, adminUserId, !league.pickingOpen);
      onLeagueUpdated(updated);
    } catch (e) {
      setPickingError(e instanceof Error ? e.message : "Failed to update picking state");
    } finally {
      setTogglingPicking(false);
    }
  };

  const formFor = (c: Contestant): StatusForm =>
    edits[c.id] ?? {
      eliminatedEpisode: c.eliminatedEpisode !== null ? String(c.eliminatedEpisode) : "",
      winner: c.winner,
    };

  const setForm = (c: Contestant, patch: Partial<StatusForm>) => {
    setEdits((prev) => ({ ...prev, [c.id]: { ...formFor(c), ...patch } }));
  };

  const handleSaveStatus = async (c: Contestant) => {
    const form = formFor(c);
    setStatusError("");
    setSavingId(c.id);
    try {
      const eliminatedEpisode = form.eliminatedEpisode === "" ? null : Number(form.eliminatedEpisode);
      const updated = await updateContestantStatus(league.id, adminUserId, c.id, eliminatedEpisode, form.winner);
      onContestantsChanged(contestants.map((existing) => (existing.id === updated.id ? updated : existing)));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[c.id];
        return next;
      });
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Failed to update contestant status");
    } finally {
      setSavingId(null);
    }
  };

  const contestantsForTribe = (tribeId: number) => contestants.filter((c) => c.tribeId === tribeId);
  const unassigned = contestants.filter((c) => c.tribeId === null);

  const statusRow = (c: Contestant) => {
    const form = formFor(c);
    const dirty = edits[c.id] !== undefined;
    return (
      <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card flex-wrap">
        <div className="min-w-[10rem] flex-1">
          <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Out ep.</label>
          <Input
            type="number"
            min={1}
            placeholder="Still in"
            className="w-24 h-8"
            value={form.eliminatedEpisode}
            onChange={(e) => setForm(c, { eliminatedEpisode: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={form.winner}
            onChange={(e) => setForm(c, { winner: e.target.checked })}
          />
          Winner
        </label>
        {dirty && (
          <Button size="sm" className="gap-1.5 h-8" onClick={() => handleSaveStatus(c)} disabled={savingId === c.id}>
            <Save className="h-3.5 w-3.5" />
            {savingId === c.id ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Picking control ── */}
      <Card>
        <CardHeader>
          <CardTitle>Roster Picking</CardTitle>
          <CardDescription>
            Manually control whether members can submit or change their roster picks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={league.pickingOpen ? "bg-green-500/10 text-green-500 border-green-500" : ""}
            >
              {league.pickingOpen ? "Picking Open" : "Picking Closed"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleTogglePicking}
              disabled={togglingPicking}
            >
              {league.pickingOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {togglingPicking ? "Updating..." : league.pickingOpen ? "Close Picking" : "Open Picking"}
            </Button>
          </div>
          {pickingError && <p className="text-sm text-destructive">{pickingError}</p>}
        </CardContent>
      </Card>

      {/* ── Cast status ── */}
      <Card>
        <CardHeader>
          <CardTitle>Cast Status</CardTitle>
          <CardDescription>
            Record eliminations and the season winner as the season plays out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {statusError && <p className="text-sm text-destructive">{statusError}</p>}
          {tribes.map((tribe) => {
            const members = contestantsForTribe(tribe.id);
            if (members.length === 0) return null;
            return (
              <div key={tribe.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tribe.colour }} />
                  <span className="font-medium">{tribe.name} Tribe</span>
                </div>
                <div className="space-y-2">{members.map(statusRow)}</div>
              </div>
            );
          })}
          {unassigned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                <span className="font-medium">No Tribe</span>
              </div>
              <div className="space-y-2">{unassigned.map(statusRow)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
