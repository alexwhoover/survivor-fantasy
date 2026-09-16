import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  getScoringGrid,
  type MergeActionResponse,
  type RosterResponse,
  type ScoringGridResponse,
  type ScoringGridRow,
} from "../../api";

interface Props {
  leagueId: number;
  /** The viewing member's roster, for the "Highlight my roster" overlay. */
  roster: RosterResponse | null;
  mergeAction: MergeActionResponse | null;
}

/**
 * Sequential single-hue ramp (the app's ember orange), anchored to the card surface so a
 * low score recedes rather than shouting. Six steps rather than a continuous blend so the
 * legend can name the scale.
 */
const HEAT = ["#271813", "#442317", "#65301d", "#8c3f23", "#b74f2a", "#ec6432"];
/** Ink flips to dark on the two hottest steps, where white would drop under 3.5:1. */
const HEAT_INK = ["#c9a893", "#f5f5f5", "#f5f5f5", "#f5f5f5", "#1a0d06", "#1a0d06"];

function heatIndex(points: number, maxPoints: number): number {
  if (points <= 0 || maxPoints <= 0) return 0;
  const step = Math.ceil((points / maxPoints) * HEAT.length) - 1;
  return Math.min(Math.max(step, 0), HEAT.length - 1);
}

interface Tip {
  row: ScoringGridRow;
  episode: number;
  points: number | null;
  uncounted: boolean;
  x: number;
  y: number;
}

export function ScoringGrid({ leagueId, roster, mergeAction }: Props) {
  const [grid, setGrid] = useState<ScoringGridResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [rosterOnly, setRosterOnly] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    setFailed(false);
    getScoringGrid(leagueId).then(setGrid).catch(() => setFailed(true));
  }, [leagueId]);

  const mergeEpisode = grid?.mergeEpisode ?? null;
  const addedId = mergeAction?.addedContestantId ?? null;
  const removedId = mergeAction?.removedContestantId ?? null;

  /**
   * Contestants whose points can count for this member — their current picks plus the one
   * swapped out at the merge, which still scored up to the merge episode.
   */
  const myContestantIds = useMemo(() => {
    if (!roster) return new Set<number>();
    const ids = new Set<number>(roster.contestantIds);
    if (removedId !== null) ids.add(removedId);
    return ids;
  }, [roster, removedId]);

  /** Mirrors LeaderboardService#isPointCounted — the merge boundary, from the member's side. */
  function counts(contestantId: number, episode: number): boolean {
    if (!myContestantIds.has(contestantId)) return false;
    if (mergeEpisode === null) return true;
    if (contestantId === addedId) return episode > mergeEpisode;
    if (contestantId === removedId) return episode <= mergeEpisode;
    return true;
  }

  /** The member's counted total for one castaway, shown in place of the season total. */
  function countedTotal(row: ScoringGridRow): number {
    return row.points.reduce<number>(
      (sum, pts, i) => (pts !== null && counts(row.contestantId, i + 1) ? sum + pts : sum),
      0,
    );
  }

  function showTip(
    e: MouseEvent<HTMLTableCellElement>,
    row: ScoringGridRow,
    episode: number,
    points: number | null,
    uncounted: boolean,
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ row, episode, points, uncounted, x: rect.left + rect.width / 2, y: rect.top });
  }

  if (failed) {
    return <p className="text-sm text-muted-foreground">Couldn't load scores.</p>;
  }

  if (grid === null) {
    return null;
  }

  if (grid.episodeCount === 0 || grid.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No scores yet.</p>;
  }

  const episodes = Array.from({ length: grid.episodeCount }, (_, i) => i + 1);
  const canOverlay = roster !== null;
  const overlayOn = rosterOnly && canOverlay;

  const myTotal = overlayOn
    ? grid.rows.reduce((sum, row) => sum + countedTotal(row), 0)
    : 0;

  return (
    <div>
      {canOverlay && (
        <div className="mb-2.5">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              id="scoring-grid-roster-overlay"
              type="checkbox"
              checked={rosterOnly}
              onChange={(e) => setRosterOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary cursor-pointer"
            />
            Highlight my roster
          </label>
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full border-separate border-spacing-0 tabular-nums">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-card text-left font-normal text-[11px] tracking-wider text-muted-foreground uppercase w-[172px] min-w-[172px] h-[34px] pl-3 pr-2 border-b border-border shadow-[1px_0_0_var(--border)]">
                Castaway
              </th>
              {episodes.map((ep) => (
                <th
                  key={ep}
                  className={`bg-card font-normal text-[11px] text-muted-foreground w-11 min-w-11 h-[34px] border-b border-border ${
                    ep === mergeEpisode ? "shadow-[inset_-2px_0_0_var(--primary)]" : ""
                  }`}
                >
                  <div>EP{ep}</div>
                  {ep === mergeEpisode && (
                    <div className="text-[8px] leading-none tracking-widest text-primary">MERGE</div>
                  )}
                </th>
              ))}
              <th className="bg-card font-normal text-[11px] tracking-wider text-muted-foreground uppercase w-[54px] min-w-[54px] h-[34px] border-b border-border shadow-[inset_1px_0_0_var(--border)]">
                Tot
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => {
              const mine = myContestantIds.has(row.contestantId);
              const dimmed = overlayOn && !mine;
              const total = overlayOn && mine ? countedTotal(row) : row.total;

              return (
                <tr
                  key={row.contestantId}
                  className={`h-[34px] transition-opacity ${dimmed ? "opacity-25" : ""}`}
                >
                  <td
                    className={`sticky left-0 z-10 bg-card pl-3 pr-2 border-b border-[#1c1c1c] ${
                      overlayOn && mine
                        ? "shadow-[inset_2px_0_0_var(--primary),1px_0_0_var(--border)]"
                        : "shadow-[1px_0_0_var(--border)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-[7px] w-[7px] rounded-full shrink-0"
                        style={{ backgroundColor: row.tribeColour ?? "var(--muted-foreground)" }}
                      />
                      <span className="text-[13px] truncate">
                        {row.firstName} {row.lastName}
                      </span>
                      <span
                        className={`text-[9.5px] tracking-wide shrink-0 ${
                          row.winner ? "text-primary" : "text-muted-foreground/70"
                        }`}
                      >
                        {row.winner
                          ? "WINNER"
                          : row.eliminatedEpisode !== null
                            ? `E${row.eliminatedEpisode}`
                            : "IN"}
                      </span>
                    </div>
                  </td>

                  {episodes.map((ep) => {
                    const pts = row.points[ep - 1] ?? null;
                    const out = row.eliminatedEpisode !== null && ep > row.eliminatedEpisode;
                    const mergeEdge = ep === mergeEpisode;
                    const uncounted = overlayOn && mine && pts !== null && !counts(row.contestantId, ep);

                    const style: CSSProperties = {
                      boxShadow: mergeEdge ? "inset -2px 0 0 var(--primary)" : undefined,
                    };
                    if (out) {
                      style.backgroundColor = "#101010";
                      style.color = "#262626";
                    } else if (pts === null) {
                      style.color = "#3a3a3a";
                    } else {
                      const i = heatIndex(pts, grid.maxPoints);
                      style.backgroundColor = HEAT[i];
                      style.color = HEAT_INK[i];
                      if (i >= 4) style.fontWeight = 500;
                      if (uncounted) {
                        // The points exist — they just don't count for this member.
                        style.backgroundImage =
                          "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(10,10,10,0.62) 3px 6px)";
                        style.color = "#6e6e6e";
                        style.fontWeight = 400;
                      }
                    }

                    return (
                      <td
                        key={ep}
                        className="text-center text-xs border-b border-[#1c1c1c]"
                        style={style}
                        onMouseEnter={
                          out ? undefined : (e) => showTip(e, row, ep, pts, uncounted)
                        }
                        onMouseLeave={() => setTip(null)}
                      >
                        {out ? "" : pts === null ? "·" : pts}
                      </td>
                    );
                  })}

                  <td className="text-center text-[12.5px] font-medium border-b border-[#1c1c1c] shadow-[inset_1px_0_0_var(--border)]">
                    {total > 0 ? total : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-x-6 gap-y-2 mt-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>0</span>
          <span className="flex gap-0.5">
            {HEAT.map((c) => (
              <span key={c} className="w-[22px] h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span>{grid.maxPoints} pts</span>
        </div>

        <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#101010] border border-[#242424]" />
            Out of the game
          </span>
          {mergeEpisode !== null && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[3px] h-3 rounded-sm bg-primary" />
              Merge
            </span>
          )}
          {overlayOn && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: HEAT[2],
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(10,10,10,0.62) 3px 6px)",
                }}
              />
              Doesn't count for you
            </span>
          )}
        </div>

        {overlayOn && (
          <div className="text-[12.5px] text-muted-foreground tabular-nums">
            Counted contestant points{" "}
            <span className="text-primary font-medium text-[15px]">{myTotal}</span>
          </div>
        )}
      </div>

      {tip && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none bg-popover border border-border rounded-md px-2.5 py-1.5 text-xs leading-snug whitespace-nowrap shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <div className="font-medium">
            {tip.row.firstName} {tip.row.lastName}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Episode {tip.episode} ·{" "}
            {tip.points === null ? "no score entered" : `${tip.points} pts`}
            {tip.uncounted &&
              (tip.row.contestantId === addedId
                ? " · joined your roster at the merge"
                : " · left your roster at the merge")}
          </div>
        </div>
      )}
    </div>
  );
}
