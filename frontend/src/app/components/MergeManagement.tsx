import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, GitMerge } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { getMergeStatus, initiateMerge, type LeagueApiResponse, type MergeStatusResponse } from "../../api";

interface Props {
  league: LeagueApiResponse;
  adminUserId: number;
  onLeagueUpdated: (updated: LeagueApiResponse) => void;
}

function useCountdown(deadline: string | null): string {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!deadline) return;
    const d = new Date(deadline);
    const update = () => {
      const diff = d.getTime() - Date.now();
      if (diff <= 0) { setText("Deadline passed"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setText(days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return text;
}

export function MergeManagement({ league, adminUserId, onLeagueUpdated }: Props) {
  const [mergeStatus, setMergeStatus] = useState<MergeStatusResponse | null>(null);
  const [mergeEpisodeInput, setMergeEpisodeInput] = useState("");
  const [mergeDeadlineInput, setMergeDeadlineInput] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState("");

  const countdown = useCountdown(mergeStatus?.mergeDeadline ?? null);

  useEffect(() => {
    getMergeStatus(league.id).then(setMergeStatus).catch(() => {});
  }, [league.id]);

  const handleInitiate = async () => {
    setError("");
    const ep = Number(mergeEpisodeInput);
    if (!ep || ep < 1) { setError("Valid merge episode number is required"); return; }
    if (!mergeDeadlineInput) { setError("Merge deadline is required"); return; }
    setInitiating(true);
    try {
      const updated = await initiateMerge(league.id, adminUserId, ep, mergeDeadlineInput);
      onLeagueUpdated(updated);
      const status = await getMergeStatus(league.id);
      setMergeStatus(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate merge");
    } finally {
      setInitiating(false);
    }
  };

  if (!mergeStatus) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const actedCount = mergeStatus.memberStatuses.filter((m) => m.hasActed).length;
  const totalCount = mergeStatus.memberStatuses.length;

  return (
    <div className="space-y-6">
      {!mergeStatus.initiated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" />
              Initiate Merge Event
            </CardTitle>
            <CardDescription>
              Once initiated, members can perform their merge action until the deadline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merge-episode">Merge Episode Number</Label>
              <Input
                id="merge-episode"
                type="number"
                min={1}
                placeholder="e.g., 7"
                value={mergeEpisodeInput}
                onChange={(e) => setMergeEpisodeInput(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merge-deadline">Merge Action Deadline</Label>
              <Input
                id="merge-deadline"
                type="datetime-local"
                value={mergeDeadlineInput}
                onChange={(e) => setMergeDeadlineInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Members must complete their add/swap before this date and time
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleInitiate} disabled={initiating} className="gap-2">
              <GitMerge className="h-4 w-4" />
              {initiating ? "Initiating..." : "Initiate Merge"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-primary bg-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <GitMerge className="h-5 w-5" />
                Merge Active — Episode {mergeStatus.mergeEpisode}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                {mergeStatus.mergeDeadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className={mergeStatus.deadlinePassed ? "text-destructive font-medium" : "font-medium"}>
                      {mergeStatus.deadlinePassed ? "Passed" : countdown}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Actions completed: </span>
                  <span className="font-semibold">{actedCount} / {totalCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Action Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mergeStatus.memberStatuses.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-card"
                  >
                    <span className="font-medium">{member.username}</span>
                    {member.hasActed ? (
                      <div className="flex items-center gap-1.5 text-sm text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Done</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Circle className="h-4 w-4" />
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {actedCount === totalCount && totalCount > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  All members have completed their merge actions.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
