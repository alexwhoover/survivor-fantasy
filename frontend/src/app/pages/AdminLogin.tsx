import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import torchIcon from "../../assets/torch.png";
import loginBackground from "../../assets/jeff-full-width-background-faded.jpg";
import { adminLogin } from "../../api";
import { useAdmin } from "../context/AdminContext";

/**
 * The site's only sign-in, and it's for the admin alone — there is no registration,
 * because players don't have accounts. Visitors who land here by accident get a way
 * back rather than a dead end.
 */
export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setIsAdmin } = useAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminLogin(username, password);
      setIsAdmin(true);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background bg-cover bg-left-top bg-no-repeat isolate"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img src={torchIcon} alt="" className="h-20 w-auto sm:h-24" />
          </div>
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Survivor Fantasy</h1>
          <p className="text-muted-foreground">Outwit. Outplay. Outlast.</p>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl fire-glow">
          <CardHeader>
            <CardTitle>Admin Sign-in</CardTitle>
            <CardDescription>
              Only the league organizer needs this — everything else is open to everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="min-h-[44px] border-border bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="min-h-[44px] border-border bg-input"
                />
              </div>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              <Button type="submit" className="mt-6 min-h-[44px] w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the leagues
          </Link>
        </div>
      </div>
    </div>
  );
}
