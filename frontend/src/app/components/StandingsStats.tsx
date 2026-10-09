import type { ReactNode } from "react";
import hotIcon from "../../assets/hot-icon.svg";
import upArrowIcon from "../../assets/up-arrow.svg";
import type { LeagueStats } from "../../api";

/** "Sam", "Sam & Jo", "Sam, Jo & Riley" — ties list everyone rather than collapsing to "3-way tie". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function Name({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

function Highlight({ children }: { children: ReactNode }) {
  return <span className="font-bold tabular-nums text-primary">{children}</span>;
}

/**
 * The icon is absolutely positioned in its panel so the card's height comes from the text —
 * an <img> of a viewBox-only SVG would otherwise fall back to a 300×150 intrinsic size and
 * stretch the card. The text is pinned to the top so side-by-side cards line up
 * even when one sentence wraps to more lines than the other.
 */
function StatCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[96px] overflow-hidden rounded-xl border border-border bg-muted/50">
      <div className="relative w-[72px] shrink-0 sm:w-[88px]">
        <img
          src={icon}
          alt=""
          className="absolute inset-0 h-full w-full object-contain px-4 py-3"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-start gap-2.5 py-3 pr-4">
        {/* A background-image underline paints behind the glyphs, so descenders sit over it
            rather than the line cutting across (or skipping around) them. It's lifted 0.12em
            off the box's bottom (which is below the descenders) to sit just under the baseline. */}
        <span className="text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          <span className="bg-[linear-gradient(var(--primary),var(--primary))] bg-[length:100%_2.5px] bg-[position:0_calc(100%_-_0.06em)] bg-no-repeat [box-decoration-break:clone]">
            {label}
          </span>
        </span>
        <p className="break-words text-base leading-snug text-foreground/80 sm:text-lg">{children}</p>
      </div>
    </div>
  );
}

/**
 * Episode MVP and biggest climber for the latest scored episode, above the Leaderboard.
 * Renders nothing until two episodes are scored — with one there's no previous week to compare.
 */
export function StandingsStats({ stats }: { stats: LeagueStats | null }) {
  if (!stats || stats.episodeNumber < 2) return null;

  const { episodeNumber, episodeMvp, biggestMovers } = stats;
  const mover = biggestMovers[0];
  const climb = mover ? mover.fromRank - mover.toRank : 0;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {episodeMvp && (
        <StatCard icon={hotIcon} label={`Episode ${episodeNumber} MVP`}>
          <Name>{joinNames(episodeMvp.usernames)}</Name>
          {episodeMvp.usernames.length > 1 ? " each gained " : " gained "}
          <Highlight>{episodeMvp.points}</Highlight> {episodeMvp.points === 1 ? "point" : "points"}
        </StatCard>
      )}
      <StatCard icon={upArrowIcon} label="Biggest Mover">
        {mover ? (
          <>
            <Name>{joinNames(biggestMovers.map((m) => m.username))}</Name>
            {biggestMovers.length > 1 ? " each moved up " : " moved up "}
            <Highlight>▲{climb}</Highlight> {climb === 1 ? "spot" : "spots"}
          </>
        ) : (
          "Nobody moved up this week"
        )}
      </StatCard>
    </div>
  );
}
