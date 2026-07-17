import { useState, useMemo } from "react";
import { ArrowLeftRight, Plus, Crown, CheckCircle2, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { performMergeAction, type Contestant, type RosterResponse, type MergeStatusResponse } from "../../api";

interface Props {
  open: boolean;
  onClose: () => void;
  leagueId: number;
  userId: number;
  currentRoster: RosterResponse;
  contestants: Contestant[];
  maxRosterSize: number;
  onSuccess: (status: MergeStatusResponse) => void;
}

export function MergeActionModal({
  open,
  onClose,
  leagueId,
  userId,
  currentRoster,
  contestants,
  maxRosterSize,
  onSuccess,
}: Props) {
  const [addId, setAddId] = useState<number | null>(null);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSwap = currentRoster.contestantIds.length >= maxRosterSize;
  const actionType = isSwap ? "SWAP" : "ADD";

  const rosterSet = new Set(currentRoster.contestantIds);

  // Contestants eligible to be added: not on roster, not eliminated
  const addableContestants = useMemo(
    () => contestants.filter((c) => !rosterSet.has(c.id) && c.eliminatedEpisode === null),
    [contestants, currentRoster.contestantIds]
  );

  // Contestants eligible to be removed (swap only): on roster, not eliminated
  const removableContestants = useMemo(
    () =>
      contestants.filter(
        (c) => rosterSet.has(c.id) && c.eliminatedEpisode === null
      ),
    [contestants, currentRoster.contestantIds]
  );

  // Group addable contestants by tribe
  const tribes = [...new Set(addableContestants.map((c) => c.tribe).filter(Boolean) as string[])];

  const handleSubmit = async () => {
    setError("");
    if (!addId) { setError("Select a contestant to add"); return; }
    if (isSwap && !removeId) { setError("Select a contestant to remove"); return; }
    setSubmitting(true);
    try {
      const status = await performMergeAction(leagueId, userId, addId, isSwap ? removeId : null);
      onSuccess(status);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to perform merge action");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeepRoster = async () => {
    setError("");
    setSubmitting(true);
    try {
      const status = await performMergeAction(leagueId, userId, null, null, true);
      onSuccess(status);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to keep your current roster");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAddId(null);
    setRemoveId(null);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSwap ? <ArrowLeftRight className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            Merge {isSwap ? "Swap" : "Add"}
          </DialogTitle>
          <DialogDescription>
            {isSwap
              ? "Your roster is full. Select one contestant to remove and one to add."
              : "Your roster has an open spot. Select a contestant to add."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Remove section — swap only */}
          {isSwap && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold">–</span>
                Select contestant to remove
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {removableContestants.map((c) => {
                  const selected = removeId === c.id;
                  const isMVP = c.id === currentRoster.mvpContestantId;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selected ? "border-destructive bg-destructive/10" : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => setRemoveId(selected ? null : c.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            {isMVP && <Crown className="h-3.5 w-3.5 text-primary" />}
                            {c.firstName} {c.lastName}
                          </div>
                          {c.tribe && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {c.tribeColour && (
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.tribeColour }} />
                              )}
                              <span className="text-xs text-muted-foreground">{c.tribe}</span>
                            </div>
                          )}
                        </div>
                        {selected ? (
                          <CheckCircle2 className="h-4 w-4 text-destructive" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add section */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">+</span>
              Select contestant to add
            </h3>
            {addableContestants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No eligible contestants available.</p>
            ) : (
              <div className="space-y-4">
                {tribes.map((tribe) => {
                  const tribeContestants = addableContestants.filter((c) => c.tribe === tribe);
                  if (tribeContestants.length === 0) return null;
                  const tribeColor = tribeContestants[0]?.tribeColour ?? "#6B7280";

                  return (
                    <div key={tribe}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tribeColor }} />
                        <span className="text-sm font-medium text-muted-foreground">{tribe} Tribe</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tribeContestants.map((c) => {
                          const selected = addId === c.id;
                          return (
                            <div
                              key={c.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selected ? "border-primary bg-accent" : "border-border hover:border-muted-foreground"
                              }`}
                              onClick={() => setAddId(selected ? null : c.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
                                </div>
                                {selected ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {(addId || removeId) && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
              {removeId && (
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-medium">Remove:</span>
                  <span>{contestants.find((c) => c.id === removeId)?.firstName} {contestants.find((c) => c.id === removeId)?.lastName}</span>
                </div>
              )}
              {addId && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium">Add:</span>
                  <span>{contestants.find((c) => c.id === addId)?.firstName} {contestants.find((c) => c.id === addId)?.lastName}</span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            {isSwap && (
              <Button variant="outline" onClick={handleKeepRoster} disabled={submitting} className="mr-auto">
                {submitting ? "Submitting..." : "Keep My Roster"}
              </Button>
            )}
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !addId || (isSwap && !removeId)}
              className="gap-2"
            >
              {isSwap ? <ArrowLeftRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Submitting..." : `Confirm ${isSwap ? "Swap" : "Add"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
