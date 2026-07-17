import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { getLeaderboardHistory, type LeaderboardHistoryEntry } from "../../api";

interface Props {
  leagueId: number;
}

// Fixed hue order (colorblind-validated, dark-surface set) — assigned by userId, never by rank,
// so a player's color stays stable across the season as standings shift.
const PALETTE = [
  "#3987e5",
  "#008300",
  "#d55181",
  "#c98500",
  "#199e70",
  "#d95926",
  "#9085e9",
  "#e66767",
];

interface SeriesMeta {
  userId: number;
  username: string;
  color: string;
}

function buildSeriesMeta(entries: LeaderboardHistoryEntry[]): SeriesMeta[] {
  return [...entries]
    .sort((a, b) => a.userId - b.userId)
    .map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      color: PALETTE[index % PALETTE.length],
    }));
}

function SelectedDot(props: any) {
  const { cx, cy, value, color } = props;
  if (cx == null || cy == null) return null;
  const text = String(value);
  const paddingX = 6;
  const width = text.length * 7 + paddingX * 2;
  const height = 18;
  const labelY = cy - 14;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--card)" strokeWidth={2} />
      <rect
        x={cx - width / 2}
        y={labelY - height / 2}
        width={width}
        height={height}
        rx={4}
        fill="var(--popover)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text x={cx} y={labelY} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500} fill="var(--foreground)">
        {text}
      </text>
    </g>
  );
}

export function StandingsGraph({ leagueId }: Props) {
  const [history, setHistory] = useState<LeaderboardHistoryEntry[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLeaderboardHistory(leagueId).then(setHistory).catch(() => setHistory([]));
  }, [leagueId]);

  useEffect(() => {
    if (selectedUserId === null) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedUserId(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedUserId(null);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedUserId]);

  const seriesMeta = useMemo(() => buildSeriesMeta(history ?? []), [history]);

  const rows = useMemo(() => {
    const episodeCount = history?.[0]?.history.length ?? 0;
    return Array.from({ length: episodeCount }, (_, i) => {
      const row: Record<string, number> = { episodeNumber: i + 1 };
      for (const entry of history ?? []) {
        row[String(entry.userId)] = entry.history[i]?.cumulativeScore ?? 0;
      }
      return row;
    });
  }, [history]);

  function toggleSelected(userId: number) {
    setSelectedUserId((prev) => (prev === userId ? null : userId));
  }

  if (history === null) {
    return null;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No scores yet.</p>;
  }

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="episodeNumber"
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            label={{ value: "Episode", position: "insideBottom", offset: -8, fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            width={40}
          />
          {seriesMeta.map((meta) => (
            <Line
              key={`line-${meta.userId}`}
              type="monotone"
              dataKey={String(meta.userId)}
              stroke={selectedUserId === null || selectedUserId === meta.userId ? meta.color : "var(--muted-foreground)"}
              strokeWidth={selectedUserId === meta.userId ? 3 : 2}
              dot={selectedUserId === meta.userId ? (props: any) => <SelectedDot key={props.key} {...props} color={meta.color} /> : false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          {seriesMeta.map((meta) => (
            <Line
              key={`hit-${meta.userId}`}
              type="monotone"
              dataKey={String(meta.userId)}
              stroke="transparent"
              strokeWidth={24}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              onClick={() => toggleSelected(meta.userId)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
        {seriesMeta.map((meta) => (
          <button
            key={meta.userId}
            type="button"
            onClick={() => toggleSelected(meta.userId)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 0,
                borderTop: `2px solid ${meta.color}`,
              }}
            />
            {meta.username}
          </button>
        ))}
      </div>
    </div>
  );
}
