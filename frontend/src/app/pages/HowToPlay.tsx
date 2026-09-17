import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Trophy, GitMerge } from "lucide-react";
import jeffProbstField from "../../assets/jeff-probst-field.jpg";
import { EmberBackground } from "../components/EmberBackground";

export function HowToPlay() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 relative">
      <EmberBackground />
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <img src={jeffProbstField} alt="Jeff Probst" className="w-full max-w-2xl rounded-lg" />
        </div>
        <h1 className="mb-3">How to Play</h1>
        <p className="text-lg text-muted-foreground">
          Draft a Fantasy Tribe, earn points every episode, and outlast your friends to win the
          league.
        </p>
      </div>

      <div className="space-y-6">

        {/* Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>The Steps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            <div className="space-y-1">
              <p className="font-semibold">Step 1 — Draft Your Fantasy Tribe</p>
              <p className="text-muted-foreground">
                Pick castaways from each starting tribe that you think will make it to the end.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 2 — Choose Your MVP</p>
              <p className="text-muted-foreground">
                Designate one of your picks as MVP. If they're crowned Sole Survivor, you
                earn a 30-point bonus.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 3 — Update Episode Scores</p>
              <p className="text-muted-foreground">
                At least one person in your league should be the admin. After each episode airs, they input the points
                earned by each player.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 4 — Watch Your Score Climb</p>
              <p className="text-muted-foreground">
                Once the admin enters a week's points, your roster and the league
                leaderboard update automatically.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Merge */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GitMerge className="h-6 w-6 text-primary" />
              <CardTitle>Merge Twist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Once the tribes merge, everyone gets one roster change:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Lost a castaway before the merge?</strong> Add a
                new one to fill the open spot.
              </li>
              <li>
                <strong className="text-foreground">Still have a full roster?</strong> Swap one of
                your picks for a new castaway.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Scoring at the swap:</strong> a newly added or
              swapped-in castaway only earns you points from episodes after the
              merge episode. Points they scored before joining your roster don't count. A
              swapped-out castaway still counts for every episode up to and
              including the merge episode, but nothing after you drop them.
            </p>
          </CardContent>
        </Card>

        {/* Winning */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Winning the League</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Whoever has the most points after the season finale wins the league.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
