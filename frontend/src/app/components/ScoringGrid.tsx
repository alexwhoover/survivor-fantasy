import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  getScoringGrid,
  type Player,
  type RosterResponse,
  type ScoringGridResponse,
  type ScoringGridRow,
} from "../../api";

interface Props {
  leagueId: number;
  /** Whose rosters can be overlaid on the grid. */
  players: Player[];
  rosters: RosterResponse[];
}

/**
 * Warm analogous heat ramp, sand -> amber -> orange -> orange-red. Every step sits in the
 * light-to-mid luminance band so a low score still reads clearly against the dark card —
 * anchoring the low end to the surface instead made small values disappear into it.
 * Six steps rather than a continuous blend so the legend can name the scale.
 */
const HEAT = ["#f7e5cb", "#f3d1a1", "#efb974", "#ea9f4f", "#e28034", "#d95f28"];
/** One dark ink across the whole ramp — clears 4.5:1 even on the hottest step. */
const HEAT_INK = "#1a0d06";

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

export function ScoringGrid({ leagueId, players, rosters }: Props) {
  const [grid, setGrid] = useState<ScoringGridResponse | null>(null);
  const [failed, setFailed] = useState(false);
  // Which player's roster to overlay. Nobody has a roster "of their own" any more, so
  // the old "highlight my roster" checkbox became a pick-a-player control — the same
  // mechanic, now useful to every visitor rather than only the signed-in owner.
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    setFailed(false);
    getScoringGrid(leagueId).then(setGrid).catch(() => setFailed(true));
  }, [leagueId]);

  const roster = useMemo(
    () => rosters.find((r) => r.userId === highlightId) ?? null,
    [rosters, highlightId],
  );

  const mergeEpisode = grid?.mergeEpisode ?? null;
  const addedId = roster?.mergeAction?.addedContestantId ?? null;
  const removedId = roster?.mergeAction?.removedContestantId ?? null;

  /**
   * Contestants whose points can count for the highlighted player — their current picks
   * plus the one swapped out at the merge, which still scored up to the merge episode.
   */
  const theirContestantIds = useMemo(() => {
    if (!roster) return new Set<number>();
    const ids = new Set<number>(roster.contestantIds);
    if (removedId !== null) ids.add(removedId);
    return ids;
  }, [roster, removedId]);

  /** Mirrors LeaderboardService#isPointCounted — the merge boundary, from the player's side. */
  function counts(contestantId: number, episode: number): boolean {
    if (!theirContestantIds.has(contestantId)) return false;
    if (mergeEpisode === null) return true;
    if (contestantId === addedId) return episode > mergeEpisode;
    if (contestantId === removedId) return episode <= mergeEpisode;
    return true;
  }

  /** The player's counted total for one castaway, shown in place of the season total. */
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
  const overlayOn = roster !== null;
  const highlightName = players.find((p) => p.userId === highlightId)?.username ?? "";

  const overlayTotal = overlayOn
    ? grid.rows.reduce((sum, row) => sum + countedTotal(row), 0)
    : 0;

  // Only players who actually have a roster can be overlaid.
  const selectable = players.filter((p) => rosters.some((r) => r.userId === p.userId));

  return (
    <div>
      {selectable.length > 0 && (
        <div className="mb-2.5">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            Highlight roster
            <select
              value={highlightId ?? ""}
              onChange={(e) => setHighlightId(e.target.value === "" ? null : Number(e.target.value))}
              className="min-h-[32px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No one</option>
              {selectable.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.username}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-separate border-spacing-0 tabular-nums">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 h-[34px] w-[124px] min-w-[124px] border-b border-border bg-card pl-2.5 pr-2 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground shadow-[1px_0_0_var(--border)] sm:w-[172px] sm:min-w-[172px] sm:pl-3">
                Castaway
              </th>
              {episodes.map((ep) => (
                <th
                  key={ep}
                  className={`h-[34px] w-9 min-w-9 border-b border-border bg-card text-[11px] font-normal text-muted-foreground sm:w-11 sm:min-w-11 ${
                    ep === mergeEpisode ? "shadow-[inset_-2px_0_0_var(--primary)]" : ""
                  }`}
                >
                  <div>EP{ep}</div>
                  {ep === mergeEpisode && (
                    <div className="text-[8px] leading-none tracking-widest text-primary">MERGE</div>
                  )}
                </th>
              ))}
              <th className="h-[34px] w-[46px] min-w-[46px] border-b border-border bg-card text-[11px] font-normal uppercase tracking-wider text-muted-foreground shadow-[inset_1px_0_0_var(--border)] sm:w-[54px] sm:min-w-[54px]">
                Tot
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => {
              const theirs = theirContestantIds.has(row.contestantId);
              const dimmed = overlayOn && !theirs;
              const total = overlayOn && theirs ? countedTotal(row) : row.total;

              return (
                <tr
                  key={row.contestantId}
                  className={`h-[34px] transition-opacity ${dimmed ? "opacity-25" : ""}`}
                >
                  <td
                    className={`sticky left-0 z-10 border-b border-[#1c1c1c] bg-card pl-2.5 pr-2 sm:pl-3 ${
                      overlayOn && theirs
                        ? "shadow-[inset_2px_0_0_var(--primary),1px_0_0_var(--border)]"
                        : "shadow-[1px_0_0_var(--border)]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <span
                        className="h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ backgroundColor: row.tribeColour ?? "var(--muted-foreground)" }}
                      />
                      <span className="truncate text-[12px] sm:text-[13px]">
                        {/* Surnames are the first thing to go when the column narrows. */}
                        <span className="sm:hidden">{row.firstName}</span>
                        <span className="hidden sm:inline">
                          {row.firstName} {row.lastName}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-[9.5px] tracking-wide ${
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
                    const uncounted = overlayOn && theirs && pts !== null && !counts(row.contestantId, ep);

                    const style: CSSProperties = {
                      boxShadow: mergeEdge ? "inset -2px 0 0 var(--primary)" : undefined,
                    };
                    if (out) {
                      style.backgroundColor = "#101010";
                      style.color = "#262626";
                    } else if (pts === null) {
                      style.color = "#3a3a3a";
                    } else {
                      style.backgroundColor = HEAT[heatIndex(pts, grid.maxPoints)];
                      style.color = HEAT_INK;
                      style.fontWeight = 500;
                      if (uncounted) {
                        // The points exist — they just don't count for this player. The
                        // hatching carries that on its own, so the value stays full-contrast.
                        style.backgroundImage =
                          "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(10,10,10,0.55) 3px 6px)";
                      }
                    }

                    return (
                      <td
                        key={ep}
                        className="border-b border-[#1c1c1c] text-center text-xs"
                        style={style}
                        onMouseEnter={out ? undefined : (e) => showTip(e, row, ep, pts, uncounted)}
                        onMouseLeave={() => setTip(null)}
                      >
                        {out ? "" : pts === null ? "·" : pts}
                      </td>
                    );
                  })}

                  <td className="border-b border-[#1c1c1c] text-center text-[12.5px] font-medium shadow-[inset_1px_0_0_var(--border)]">
                    {total > 0 ? total : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>0</span>
          <span className="flex gap-0.5">
            {HEAT.map((c) => (
              <span key={c} className="h-3 w-[18px] rounded-sm sm:w-[22px]" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span>{grid.maxPoints} pts</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-[#242424] bg-[#101010]" />
            Out of the game
          </span>
          {mergeEpisode !== null && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-[3px] rounded-sm bg-primary" />
              Merge
            </span>
          )}
          {overlayOn && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: HEAT[2],
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(10,10,10,0.55) 3px 6px)",
                }}
              />
              Doesn't count for {highlightName}
            </span>
          )}
        </div>

        {overlayOn && (
          <div className="text-[12.5px] text-muted-foreground tabular-nums">
            {highlightName}'s counted contestant points{" "}
            <span className="text-[15px] font-medium text-primary">{overlayTotal}</span>
          </div>
        )}
      </div>

      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug shadow-lg"
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
                ? ` · joined ${highlightName}'s roster at the merge`
                : ` · left ${highlightName}'s roster at the merge`)}
          </div>
        </div>
      )}
    </div>
  );
}
