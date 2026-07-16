import { useState, useEffect } from "react";
import { Crown, Pencil, CheckCircle2, Circle, X, ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AdminMergeActionModal } from "./AdminMergeActionModal";
import {
  getRosterForUser,
  adminUpdateRoster,
  getMyMergeAction,
  type LeagueApiResponse,
  type LeagueMember,
  type Contestant,
  type RosterResponse,
  type MergeActionResponse,
  type MergeStatusResponse,
} from "../../api";

interface Props {
  league: LeagueApiResponse;
  adminUserId: number;
  members: LeagueMember[];
  contestants: Contestant[];
  mergeStatus: MergeStatusResponse | null;
  maxRosterSize: number;
  onMergeStatusUpdated: (status: MergeStatusResponse) => void;
}

interface EditState {
  member: LeagueMember;
  selectedIds: number[];
  mvpId: number | null;
}

interface MergeEditTarget {
  member: LeagueMember;
  roster: RosterResponse;
  existingAction: MergeActionResponse | null;
}

export function AdminRosters({
  league, adminUserId, members, contestants,
  mergeStatus, maxRosterSize, onMergeStatusUpdated,
}: Props) {
  const [rosters, setRosters] = useState<Record<number, RosterResponse | null>>({});
  const [mergeActions, setMergeActions] = useState<Record<number, MergeActionResponse | null>>({});
  const [editState, setEditState] = useState<EditState | null>(null);
  const [mergeEditTarget, setMergeEditTarget] = useState<MergeEditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    members.forEach((m) => {
      getRosterForUser(league.id, m.userId)
        .then((r) => setRosters((prev) => ({ ...prev, [m.userId]: r })))
        .catch(() => setRosters((prev) => ({ ...prev, [m.userId]: null })));
      if (mergeStatus?.initiated) {
        getMyMergeAction(league.id, m.userId)
          .then((a) => setMergeActions((prev) => ({ ...prev, [m.userId]: a })))
          .catch(() => {});
      }
    });
  }, [league.id, members, mergeStatus?.initiated]);

  const tribes = [...new Set(contestants.map((c) => c.tribe).filter(Boolean) as string[])];

  const openRosterEdit = (member: LeagueMember) => {
    const roster = rosters[member.userId] ?? null;
    setEditState({
      member,
      selectedIds: roster?.contestantIds ?? [],
      mvpId: roster?.mvpContestantId ?? null,
    });
    setSaveError("");
  };

  const openMergeEdit = (member: LeagueMember) => {
    const roster = rosters[member.userId];
    if (!roster) return;
    setMergeEditTarget({
      member,
      roster,
      existingAction: mergeActions[member.userId] ?? null,
    });
  };

  const countByTribe = (tribe: string, selectedIds: number[]) =>
    selectedIds.filter((id) => contestants.find((c) => c.id === id)?.tribe === tribe).length;

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
    } else if (countByTribe(contestant.tribe!, selectedIds) < league.contestantsPerTribe) {
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
      const updated = await adminUpdateRoster(
        league.id, adminUserId, editState.member.userId,
        editState.selectedIds, editState.mvpId
      );
      setRosters((prev) => ({ ...prev, [editState.member.userId]: updated }));
      setEditState(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save roster");
    } finally {
      setSaving(false);
    }
  };

  const getRosterContestants = (userId: number): Contestant[] => {
    const roster = rosters[userId];
    if (!roster) return [];
    return roster.contestantIds
      .map((id) => contestants.find((c) => c.id === id))
      .filter(Boolean) as Contestant[];
  };

  const mergeActionLabel = (action: MergeActionResponse | null | undefined): string | null => {
    if (!action) return null;
    const added = contestants.find((c) => c.id === action.addedContestantId);
    const addedName = added ? `${added.firstName} ${added.lastName}` : "?";
    if (action.actionType === "ADD") return `Added ${addedName}`;
    const removed = contestants.find((c) => c.id === action.removedContestantId);
    const removedName = removed ? `${removed.firstName} ${removed.lastName}` : "?";
    return `${removedName} → ${addedName}`;
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const rosterContestants = getRosterContestants(member.userId);
        const roster = rosters[member.userId];
        const mvp = roster ? contestants.find((c) => c.id === roster.mvpContestantId) : null;
        const hasRoster = !!roster;
        const mergeAction = mergeActions[member.userId];
        const canEditMerge = mergeStatus?.initiated && hasRoster;

        return (
          <Card key={member.userId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{member.username}</CardTitle>
                  {member.role === "ADMIN" && <Badge variant="outline">Admin</Badge>}
                  {!hasRoster && <Badge variant="secondary">No roster</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {canEditMerge && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openMergeEdit(member)}
                    >
                      {mergeAction
                        ? <><ArrowLeftRight className="h-3.5 w-3.5" /> Edit Merge</>
                        : <><Plus className="h-3.5 w-3.5" /> Set Merge</>}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openRosterEdit(member)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Roster
                  </Button>
                </div>
              </div>
            </CardHeader>

            {hasRoster && (
              <CardContent className="space-y-3">
                {/* Picks */}
                <div className="flex flex-wrap gap-2">
                  {rosterContestants.map((c) => {
                    const isMVP = c.id === roster?.mvpContestantId;
                    const isMergeAdded = mergeAction?.addedContestantId === c.id;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm"
                        style={isMVP ? { borderColor: "var(--primary)", backgroundColor: "var(--accent)" } : {}}
                      >
                        {isMVP && <Crown className="h-3 w-3 text-primary" />}
                        <span>{c.firstName} {c.lastName}</span>
                        {isMergeAdded && <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />}
                        {c.eliminatedEpisode !== null && <X className="h-3 w-3 text-destructive" />}
                      </div>
                    );
                  })}
                </div>

                {/* Merge action summary */}
                {mergeAction && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">Merge {mergeAction.actionType === "SWAP" ? "Swap" : "Add"}: </span>
                      {mergeActionLabel(mergeAction)}
                    </span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Roster edit modal */}
      <Dialog open={editState !== null} onOpenChange={(open) => { if (!open) setEditState(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {editState && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Roster — {editState.member.username}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                  <span>
                    <span className="text-muted-foreground">Selected: </span>
                    <span className="font-semibold">{editState.selectedIds.length} / {league.contestantsPerTribe * tribes.length}</span>
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
                  const tribeContestants = contestants.filter((c) => c.tribe === tribe);
                  const selected = countByTribe(tribe, editState.selectedIds);
                  const tribeColor = tribeContestants[0]?.tribeColour ?? "#6B7280";

                  return (
                    <div key={tribe}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tribeColor }} />
                        <span className="font-medium">{tribe} Tribe</span>
                        <Badge variant="outline" className="text-xs">{selected}/{league.contestantsPerTribe}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tribeContestants.map((contestant) => {
                          const isSelected = editState.selectedIds.includes(contestant.id);
                          const isMVP = editState.mvpId === contestant.id;
                          const isEliminated = contestant.eliminatedEpisode !== null;
                          const canSelect = isSelected || selected < league.contestantsPerTribe;

                          return (
                            <div
                              key={contestant.id}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-primary bg-accent"
                                  : isEliminated
                                  ? "border-border opacity-50 cursor-not-allowed"
                                  : canSelect
                                  ? "border-border hover:border-muted-foreground cursor-pointer"
                                  : "border-border opacity-40 cursor-not-allowed"
                              }`}
                              onClick={() => !isEliminated && handleToggle(contestant.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-sm truncate">{contestant.firstName} {contestant.lastName}</span>
                                    {isMVP && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
                                  </div>
                                  {isEliminated && <span className="text-xs text-destructive">Ep. {contestant.eliminatedEpisode}</span>}
                                </div>
                                {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                              </div>
                              {isSelected && !isMVP && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 w-full h-6 text-xs gap-1"
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
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setEditState(null)}>Cancel</Button>
                  <Button onClick={handleSaveRoster} disabled={saving}>
                    {saving ? "Saving..." : "Save Roster"}
                  </Button>
                </div>
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
          adminUserId={adminUserId}
          targetMember={mergeEditTarget.member}
          currentRoster={mergeEditTarget.roster}
          existingAction={mergeEditTarget.existingAction}
          contestants={contestants}
          maxRosterSize={maxRosterSize}
          onSuccess={(status) => {
            // Refresh this member's merge action
            getMyMergeAction(league.id, mergeEditTarget.member.userId)
              .then((a) => setMergeActions((prev) => ({ ...prev, [mergeEditTarget.member.userId]: a })))
              .catch(() => {});
            onMergeStatusUpdated(status);
            setMergeEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
