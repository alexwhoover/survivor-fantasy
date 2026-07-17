import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Trophy, GitMerge } from "lucide-react";
import jeffProbstField from "../../assets/jeff-probst-field.jpg";

export function HowToPlay() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
                Pick castaways from each starting tribe that you think will make it to the end
                — how many you draft per tribe depends on your league's settings.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 2 — Choose Your MVP</p>
              <p className="text-muted-foreground">
                Designate <strong className="text-foreground">one of your picks as MVP</strong> — the
                castaway you think will win the whole game. If they're crowned Sole Survivor, you
                earn a <strong className="text-foreground">30-point bonus</strong>.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 3 — Designate a League Commissioner</p>
              <p className="text-muted-foreground">
                One person in your league should be the <strong className="text-foreground">Commissioner
                (Admin)</strong>. After each episode airs, they award points to castaways based on
                how they performed.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 4 — Watch Your Score Climb</p>
              <p className="text-muted-foreground">
                Once the Commissioner enters a week's points, your roster and the league
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
              swapped-in castaway only earns you points from episodes <strong className="text-foreground">after</strong> the
              merge episode — points they scored before joining your roster don't count. A
              swapped-out castaway still counts for every episode <strong className="text-foreground">up to and
              including</strong> the merge episode, but nothing after you drop them.
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
              Whoever has the most points when the season finale airs wins the league. And if
              your MVP takes home the title, that's an extra 30 points on top.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
