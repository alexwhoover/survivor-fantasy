import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { TorchIcon } from "../components/TorchIcon";
import { login, register } from "../../api";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
      }
      const user = await register(username, password);
      setUser(user);
    } else {
      const user = await login(username, password);
      setUser(user);
    }
    navigate("/leagues");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TorchIcon className="h-24 w-24" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Survivor Fantasy</h1>
          <p className="text-muted-foreground">Outwit. Outplay. Outlast.</p>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl fire-glow">
          <CardHeader>
            <CardTitle>{isRegister ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "Register to join your fantasy leagues"
                : "Sign in to manage your fantasy leagues"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              )}

              <Button type="submit" className="w-full mt-6">
                {isRegister ? "Create Account" : "Login"}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setConfirmPassword("");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isRegister ? (
                    <>
                      Already have an account?{" "}
                      <span className="text-primary font-medium">Login</span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <span className="text-primary font-medium">Register</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Join leagues, draft contestants, and compete with friends</p>
        </div>
      </div>
    </div>
  );
}
