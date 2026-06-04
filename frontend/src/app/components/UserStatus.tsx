import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { getAllRosters, type LeagueApiResponse, type LeagueMember, type MergeStatusResponse, type RosterResponse } from "../../api";

interface Props {
  league: LeagueApiResponse;
  members: LeagueMember[];
  mergeStatus: MergeStatusResponse | null;
}

function StatusIcon({ done, na }: { done: boolean; na?: boolean }) {
  if (na) return <Minus className="h-4 w-4 text-muted-foreground/50" />;
  return done
    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
    : <Circle className="h-4 w-4 text-muted-foreground" />;
}

export function UserStatus({ league, members, mergeStatus }: Props) {
  const [rosters, setRosters] = useState<RosterResponse[]>([]);

  useEffect(() => {
    getAllRosters(league.id).then(setRosters).catch(() => {});
  }, [league.id]);

  const rosterByUserId = new Map(rosters.map((r) => [r.userId, r]));
  const mergeActedIds = new Set(
    mergeStatus?.memberStatuses.filter((m) => m.hasActed).map((m) => m.userId) ?? []
  );
  const mergeInitiated = mergeStatus?.initiated ?? false;

  const submittedCount = members.filter((m) => rosterByUserId.has(m.userId)).length;
  const mergeActedCount = mergeActedIds.size;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Picks Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submittedCount}
              <span className="text-base font-normal text-muted-foreground"> / {members.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {mergeInitiated ? "Merge Actions Done" : "Merge"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mergeInitiated ? (
              <div className="text-2xl font-bold">
                {mergeActedCount}
                <span className="text-base font-normal text-muted-foreground"> / {members.length}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">Not initiated</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-member table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-center font-medium w-36">Initial Picks</th>
                <th className="px-4 py-3 text-center font-medium w-36">Merge Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => {
                const hasRoster = rosterByUserId.has(member.userId);
                const hasActed = mergeActedIds.has(member.userId);
                return (
                  <tr key={member.userId} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.username}</span>
                        {member.role === "ADMIN" && (
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusIcon done={hasRoster} />
                        <span className={hasRoster ? "text-green-500" : "text-muted-foreground"}>
                          {hasRoster ? "Submitted" : "Pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusIcon done={hasActed} na={!mergeInitiated} />
                        <span className={!mergeInitiated ? "text-muted-foreground/50" : hasActed ? "text-green-500" : "text-muted-foreground"}>
                          {!mergeInitiated ? "—" : hasActed ? "Done" : "Pending"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
