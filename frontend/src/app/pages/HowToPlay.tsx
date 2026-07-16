import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Users, Trophy, Star, Crown, GitMerge } from "lucide-react";
import jeffProbstField from "../../assets/jeff-probst-field.jpg";

function PointBadge({ pts }: { pts: number }) {
  const colour =
    pts === 15 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
    pts === 10 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                 "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${colour}`}>
      +{pts} pts
    </span>
  );
}

const FIVE_PT = [
  "Wins a group Immunity Challenge",
  "Wins a group Reward Challenge",
  "Gets chosen to go on reward",
  "Finds or gets a game advantage",
  "Plays a hidden immunity idol on themselves at Tribal Council",
  "Uses a game advantage at Tribal Council",
  "Visibly cries with tears on camera",
  "Says a curse word that is bleeped/censored",
  'Says "I miss…"',
  "Kisses another player still in the game",
  "Gets into a heated argument and shouts at another player",
  "Has a wardrobe malfunction / shows nudity blurred on screen",
  "Chooses to risk their vote",
  "Finds a fake immunity idol",
  "Hugs Jeff",
  "Is chosen to go on a journey",
];

const TEN_PT = [
  "Wins an individual Reward Challenge",
  "Finds a hidden immunity idol",
  "Voted out while in possession of a hidden immunity idol or game advantage",
  "Plays their Shot in the Dark",
  "Torch gets snuffed as a result of a blindside",
  "Gets treated for a medical emergency",
  "Chooses to forfeit the game",
  "Catches seafood or wildlife",
  "Tampers with or steals the tribe's food",
  "Plays a fake immunity idol at Tribal Council",
  "Searches through someone else's bag",
  "Voted out unanimously",
  "A hidden immunity idol is played on them by another player",
];

const FIFTEEN_PT = [
  "Wins an individual Immunity Challenge",
  "Draws a SAFE scroll as a result of playing their Shot in the Dark",
  "Wins a fire-making challenge",
  "Gives an immunity idol / necklace away or plays it for another player",
  "Creates a fake immunity idol",
  "Successfully gets another player to play their fake idol at Tribal Council",
  "Is forced to leave the game by no choice of their own (aside from being voted off)",
];

export function HowToPlay() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <img src={jeffProbstField} alt="Jeff Probst" className="w-full max-w-2xl rounded-lg" />
        </div>
        <h1 className="mb-3">How to Play</h1>
        <p className="text-lg text-muted-foreground">
          Build your Fantasy Tribe, earn points every episode, and outlast your friends to win the
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
                Pick <strong className="text-foreground">3 castaways from each starting tribe</strong> that
                you think will make it to the end of the game. With 3 tribes that gives you{" "}
                <strong className="text-foreground">9 picks total</strong>.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 2 — Choose Your MVP</p>
              <p className="text-muted-foreground">
                Out of your 9 picks, designate <strong className="text-foreground">one castaway as your MVP</strong> —
                the player you think will win the whole game. If your MVP is the Sole Survivor you earn a{" "}
                <strong className="text-foreground">30-point bonus</strong> at the end of the season.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 3 — Designate a League Commissioner</p>
              <p className="text-muted-foreground">
                One person in your league should be the <strong className="text-foreground">Commissioner</strong> (Admin).
                They're responsible for entering each episode's points after it airs.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Step 4 — Check Results Each Week</p>
              <p className="text-muted-foreground">
                After each episode airs, the Commissioner enters scores and the leaderboard updates.{" "}
                <strong className="text-foreground">Points begin accumulating from Episode 2</strong> — Episode 1
                airs before picks are locked.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Merge */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GitMerge className="h-6 w-6 text-primary" />
              <CardTitle>Merge Bonus</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              After the tribes merge you get one opportunity to adjust your Fantasy Tribe:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>
                If you <strong className="text-foreground">lost players before the merge</strong> and have
                fewer than 9 picks, you can <strong className="text-foreground">add one new castaway</strong>.
              </li>
              <li>
                If you still have all 9 picks you can{" "}
                <strong className="text-foreground">swap one of your current players</strong> for someone new.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Points for your added/swapped-in pick are <strong className="text-foreground">not retroactive</strong> — they
              start from the episode after the merge. You keep all points already earned by a
              player you swap out.
            </p>
          </CardContent>
        </Card>

        {/* Season scoring */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Season Scoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {[
                  ["1 point", "per castaway for each episode they survive pre-merge"],
                  ["3 points", "per castaway for each episode they survive post-merge"],
                  ["10 bonus points", "if any of your picks finishes in 3rd place"],
                  ["20 bonus points", "if any of your picks finishes in 2nd place"],
                  ["30 bonus points", "if any of your picks wins the game"],
                  ["30 bonus points", "if your MVP wins the game"],
                ].map(([pts, desc]) => (
                  <tr key={pts} className="flex gap-4 py-2.5">
                    <td className="w-36 shrink-0 font-semibold text-foreground">{pts}</td>
                    <td className="text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Weekly bonus */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              <CardTitle>Additional Weekly Bonus Points</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Earn bonus points each episode when your Fantasy Tribe castaways do any of the
              following on screen. Limited to one occurrence per castaway per episode — if your
              castaway cries twice, that's still 5 points for the week. Excludes recaps and "next
              time on" previews.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <PointBadge pts={5} />
                <span className="text-sm font-semibold">5-Point Actions</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground list-disc list-inside">
                {FIVE_PT.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <PointBadge pts={10} />
                <span className="text-sm font-semibold">10-Point Actions</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground list-disc list-inside">
                {TEN_PT.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <PointBadge pts={15} />
                <span className="text-sm font-semibold">15-Point Actions</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground list-disc list-inside">
                {FIFTEEN_PT.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

          </CardContent>
        </Card>

        {/* Commissioner note */}
        <Card className="bg-accent border-primary">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Commissioner Note:</strong> As the league Admin
                you enter each episode's scores after it airs. Use the scoring categories above to
                tally up each castaway's weekly total. Scores and the leaderboard update immediately
                once you save.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
