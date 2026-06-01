import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Trophy, Star, TrendingUp, Crown } from "lucide-react";
import jeffProbstField from "../../assets/jeff-probst-field.jpg";

export function HowToPlay() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <img src={jeffProbstField} alt="Jeff Probst" className="w-full max-w-2xl rounded-lg" />
        </div>
        <div className="mb-4">
          <h1>How to Play</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Welcome to Survivor Fantasy! Compete with your friends to pick the best contestants and
          earn points throughout the season.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Draft Your Roster</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              At the start of each Survivor season, you'll draft your roster of contestants:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Pick an <strong className="text-foreground">equal number of contestants from each starting tribe</strong></li>
              <li>Typically, this is <strong className="text-foreground">2 contestants per tribe</strong> for a total of 6</li>
              <li>Numbers may vary based on the season's tribe structure</li>
              <li>Submit your picks before the deadline!</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <CardTitle>Earn Points Each Episode</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Contestants on your roster earn points each episode based on their actions:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li><strong className="text-foreground">Finding idols or advantages</strong> - Big points!</li>
              <li><strong className="text-foreground">Winning immunity challenges</strong> - Individual or tribal</li>
              <li><strong className="text-foreground">Strategic gameplay</strong> - Shown in confessionals</li>
              <li><strong className="text-foreground">Dramatic moments</strong> - Crying, conflicts, memorable quotes</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Points are typically tracked by a third party (like a TV network's official scoring) and
              entered by your league admin after each episode airs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              <CardTitle>The Merge Twist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              When the tribes merge into one (usually around episode 7):
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>You can <strong className="text-foreground">add one new contestant</strong> to your roster</li>
              <li>OR <strong className="text-foreground">swap one of your current contestants</strong> if your roster is full</li>
              <li>This is your chance to adjust your strategy mid-season!</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Choose Your MVP</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              At the start of the season, designate one of your contestants as your MVP:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Your MVP must be someone on your roster</li>
              <li>If your MVP <strong className="text-foreground">wins the entire season</strong>, you earn bonus points</li>
              <li>The bonus amount is set by your league (typically 50-100 points)</li>
              <li>Choose wisely - it's a big gamble that could win you the league!</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Win Your League</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The player with the highest total points at the end of the season wins!
            </p>
            <p className="text-muted-foreground">
              Track your progress throughout the season, check the standings, and see if your picks
              can outwit, outplay, and outlast the competition.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent border-primary">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">League Admin Note:</strong> As the league
              organizer, you'll be responsible for entering contestant points after each episode.
              You can also customize rules and point values to fit your league's preferences.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
