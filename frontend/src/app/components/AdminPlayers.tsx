import { useState, useEffect } from "react";
import { Crown, Pencil, CheckCircle2, Circle, ArrowLeftRight, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AdminMergeActionModal } from "./AdminMergeActionModal";
import {
  getAllRosters,
  setRoster,
  addPlayer,
  removePlayer,
  type LeagueApiResponse,
  type Player,
  type Tribe,
  type Contestant,
  type RosterResponse,
} from "../../api";

interface Props {
  league: LeagueApiResponse;
  players: Player[];
  tribes: Tribe[];
  contestants: Contestant[];
  maxRosterSize: number;
  onPlayersUpdated: (players: Player[]) => void;
  onRostersChanged: () => void;
}

interface EditState {
  player: Player;
  selectedIds: number[];
  mvpId: number | null;
}

interface MergeEditTarget {
  player: Player;
  roster: RosterResponse;
}

function statusBadgeClass(done: boolean): string {
  return done
    ? "bg-green-500/10 text-green-500 border-green-500"
    : "bg-red-500/10 text-red-500 border-red-500";
}

export function AdminPlayers({
  league, players, tribes, contestants, maxRosterSize, onPlayersUpdated, onRostersChanged,
}: Props) {
  const [rosters, setRosters] = useState<Record<number, RosterResponse>>({});
  const [editState, setEditState] = useState<EditState | null>(null);
  const [mergeEditTarget, setMergeEditTarget] = useState<MergeEditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getAllRosters(league.id)
      .then((all) => setRosters(Object.fromEntries(all.map((r) => [r.userId, r]))))
      .catch(() => {});
  }, [league.id, players]);

  const openRosterEdit = (player: Player) => {
    const roster = rosters[player.userId] ?? null;
    setEditState({
      player,
      selectedIds: roster?.contestantIds ?? [],
      mvpId: roster?.mvpContestantId ?? null,
    });
    setSaveError("");
  };

  const openMergeEdit = (player: Player) => {
    const roster = rosters[player.userId];
    if (!roster) return;
    setMergeEditTarget({ player, roster });
  };

  const handleAddPlayer = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setRosterError("");
    try {
      onPlayersUpdated(await addPlayer(league.id, newName.trim()));
      setNewName("");
    } catch (e) {
      setRosterError(e instanceof Error ? e.message : "Failed to add player");
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setRosterError("");
    try {
      onPlayersUpdated(await removePlayer(league.id, removeTarget.userId));
      setRemoveTarget(null);
    } catch (e) {
      setRosterError(e instanceof Error ? e.message : "Failed to remove player");
    } finally {
      setRemoving(false);
    }
  };

  const countByTribe = (tribeId: number | null, selectedIds: number[]) =>
    selectedIds.filter((id) => contestants.find((c) => c.id === id)?.tribeId === tribeId).length;

  const handleToggle = (contestantId: number) => {
    if (!editState) return;
    const contestant = contestants.find((c) => c.id === contestantId);
    if (!contestant) return;
    const { selectedIds } = editState;
    if (selectedIds.includes(contestantId)) {
      setEditState({
        ...editState,
        selectedIds: selectedIds.filter((id) => id !== contestantId),
        mvpId: editState.mvpId === contestantId ? null : editState.mvpId,
      });
    } else if (countByTribe(contestant.tribeId, selectedIds) < league.contestantsPerTribe) {
      setEditState({ ...editState, selectedIds: [...selectedIds, contestantId] });
    }
  };

  const handleSaveRoster = async () => {
    if (!editState || !editState.mvpId) {
      setSaveError("Please select an MVP before saving");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const updated = await setRoster(
        league.id, editState.player.userId, editState.selectedIds, editState.mvpId,
      );
      setRosters((prev) => ({ ...prev, [editState.player.userId]: updated }));
      setEditState(null);
      onRostersChanged();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save roster");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Players don't sign up, so adding one is just naming them. */}
      <Card style={{ padding: "12px 16px" }}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Player name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddPlayer(); }}
            className="min-h-[44px] flex-1"
          />
          <Button onClick={handleAddPlayer} disabled={adding || !newName.trim()} className="min-h-[44px] gap-1.5">
            <UserPlus className="h-4 w-4" />
            {adding ? "Adding..." : "Add Player"}
          </Button>
        </div>
      </Card>

      {rosterError && <p className="text-sm text-destructive">{rosterError}</p>}

      {players.length === 0 && (
        <p className="text-sm text-muted-foreground">No players yet — add the first one above.</p>
      )}

      {players.map((player) => {
        const roster = rosters[player.userId];
        const hasRoster = !!roster;
        const mergeInitiated = league.mergeEpisode !== null;
        const mergeAction = mergeInitiated ? roster?.mergeAction : null;
        const canEditMerge = mergeInitiated && hasRoster;

        return (
          <Card key={player.userId} style={{ padding: "12px 16px" }}>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{player.username}</span>
                <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(hasRoster)}`}>
                  Roster
                </Badge>
                {mergeInitiated && (
                  <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(!!mergeAction)}`}>
                    Merge
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {canEditMerge && (
                  <Button variant="ghost" size="sm" className="min-h-[36px] gap-1.5 text-xs" onClick={() => openMergeEdit(player)}>
                    {mergeAction
                      ? <><ArrowLeftRight className="h-3.5 w-3.5" /> Edit Merge</>
                      : <><Plus className="h-3.5 w-3.5" /> Set Merge</>}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="min-h-[36px] gap-1.5 text-xs" onClick={() => openRosterEdit(player)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Roster
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[36px] gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(player)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Roster edit modal */}
      <Dialog open={editState !== null} onOpenChange={(open) => { if (!open) setEditState(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {editState && (
            <>
              <DialogHeader>
                <DialogTitle>Roster — {editState.player.username}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span>
                    <span className="text-muted-foreground">Selected: </span>
                    <span className="font-semibold">{editState.selectedIds.length} / {maxRosterSize}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">MVP: </span>
                    <span className="font-semibold">
                      {editState.mvpId
                        ? (() => { const c = contestants.find((sc) => sc.id === editState.mvpId); return c ? `${c.firstName} ${c.lastName}` : "—"; })()
                        : "Not selected"}
                    </span>
                  </span>
                </div>

                {tribes.map((tribe) => {
                  const tribeContestants = contestants.filter((c) => c.tribeId === tribe.id);
                  const selected = countByTribe(tribe.id, editState.selectedIds);

                  return (
                    <div key={tribe.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tribe.colour }} />
                        <span className="font-medium">{tribe.name} Tribe</span>
                        <Badge variant="outline" className="text-xs">{selected}/{league.contestantsPerTribe}</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {tribeContestants.map((contestant) => {
                          const isSelected = editState.selectedIds.includes(contestant.id);
                          const isMVP = editState.mvpId === contestant.id;
                          const isEliminated = contestant.eliminatedEpisode !== null;
                          const canSelect = isSelected || selected < league.contestantsPerTribe;

                          return (
                            <div
                              key={contestant.id}
                              className={`rounded-lg border-2 p-3 transition-all ${
                                isSelected
                                  ? "border-primary bg-accent"
                                  : canSelect
                                  ? "cursor-pointer border-border hover:border-muted-foreground"
                                  : "cursor-not-allowed border-border opacity-40"
                              }`}
                              onClick={() => handleToggle(contestant.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-medium">{contestant.firstName} {contestant.lastName}</span>
                                    {isMVP && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                  </div>
                                  {isEliminated && <span className="text-xs text-muted-foreground">Out Ep. {contestant.eliminatedEpisode}</span>}
                                </div>
                                {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                              </div>
                              {isSelected && !isMVP && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7 w-full gap-1 text-xs"
                                  onClick={(e) => { e.stopPropagation(); setEditState({ ...editState, mvpId: contestant.id }); }}
                                >
                                  <Crown className="h-3 w-3" />
                                  Set MVP
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button variant="outline" className="min-h-[44px]" onClick={() => setEditState(null)}>Cancel</Button>
                  <Button className="min-h-[44px]" onClick={handleSaveRoster} disabled={saving}>
                    {saving ? "Saving..." : "Save Roster"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove-player confirmation */}
      <Dialog open={removeTarget !== null} onOpenChange={(open) => { if (!open && !removing) setRemoveTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          {removeTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Remove {removeTarget.username}?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Their roster and merge move in this league are deleted with them, and the standings
                recalculate. Rosters they hold in other seasons are untouched.
              </p>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button variant="outline" className="min-h-[44px]" onClick={() => setRemoveTarget(null)} disabled={removing}>
                  Cancel
                </Button>
                <Button variant="destructive" className="min-h-[44px]" onClick={handleConfirmRemove} disabled={removing}>
                  {removing ? "Removing..." : "Remove Player"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge action edit modal */}
      {mergeEditTarget && (
        <AdminMergeActionModal
          open={true}
          onClose={() => setMergeEditTarget(null)}
          leagueId={league.id}
          targetPlayer={mergeEditTarget.player}
          currentRoster={mergeEditTarget.roster}
          contestants={contestants}
          maxRosterSize={maxRosterSize}
          onSuccess={(roster) => {
            setRosters((prev) => ({ ...prev, [roster.userId]: roster }));
            onRostersChanged();
            setMergeEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
