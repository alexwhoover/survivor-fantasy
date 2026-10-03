import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Trophy } from "lucide-react";
import { Card } from "../components/ui/card";
import { EmberBackground } from "../components/EmberBackground";
import { getLeagues, type LeagueApiResponse } from "../../api";

/**
 * The site's front door. Leagues are global, so this is the same list for everyone.
 * With a single active league — the normal case — it steps aside and sends visitors
 * straight to it, so nobody pays a click to read a list of one.
 */
export function Leagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<LeagueApiResponse[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getLeagues()
      .then((all) => {
        const active = all.filter((l) => !l.archived);
        if (active.length === 1 && all.length === 1) {
          navigate(`/league/${active[0].id}`, { replace: true });
          return;
        }
        setLeagues(all);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load leagues"));
  }, [navigate]);

  if (error) {
    return <p className="px-4 py-8 text-sm text-muted-foreground sm:px-6">{error}</p>;
  }

  if (leagues === null) {
    return null;
  }

  const active = leagues.filter((l) => !l.archived);
  const archived = leagues.filter((l) => l.archived);

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <EmberBackground />
      <h1 className="mb-6">Leagues</h1>

      {leagues.length === 0 ? (
        <div className="py-16 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-primary opacity-40" />
          <p className="text-muted-foreground">No leagues yet.</p>
        </div>
      ) : (
        <>
          <LeagueList leagues={active} />
          {archived.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Past seasons</h2>
              <LeagueList leagues={archived} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeagueList({ leagues }: { leagues: LeagueApiResponse[] }) {
  return (
    <div className="space-y-2">
      {leagues.map((league) => (
        <Link key={league.id} to={`/league/${league.id}`} className="block">
          <Card className="cursor-pointer p-4 transition-colors hover:border-primary">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-medium">{league.name}</div>
                <div className="truncate text-sm text-muted-foreground">{league.seasonName}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
