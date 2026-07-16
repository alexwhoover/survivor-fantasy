import { Link } from "react-router-dom";
import { Trophy, Users, Crown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import survivorLogo from "../../assets/survivor-logo.svg";

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <img src={survivorLogo} alt="Survivor Fantasy" className="h-40 w-auto" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Survivor Fantasy</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Outwit. Outplay. Outlast.
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Draft your contestants, earn points each episode, and compete with
          friends across the entire Survivor season.
        </p>
        {user ? (
          <Link to="/leagues">
            <Button size="lg" className="gap-2">
              <Trophy className="h-4 w-4" />
              Go to My Leagues
            </Button>
          </Link>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg">Login</Button>
            </Link>
            <Link to="/how-to-play">
              <Button size="lg" variant="outline">How to Play</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Draft Your Roster</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pick contestants from each starting tribe before the season begins.
              You're locked in once the deadline hits.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Earn Points</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your contestants earn points each episode for challenges, idols,
              and big moves. Track the standings in real time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Pick Your MVP</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Designate one contestant as your MVP. If they win the season,
              you earn a massive bonus — enough to win the whole league.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
