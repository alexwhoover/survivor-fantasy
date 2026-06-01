import { Link, useLocation, useNavigate } from "react-router-dom";
import { TorchIcon } from "./TorchIcon";
import { LogOut, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { logout } from "../../api";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="border-b border-border bg-card shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="Home">
            <TorchIcon className="h-10 w-10" />
            <span className="text-xl font-semibold text-foreground">Survivor Fantasy</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/leagues"
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive("/leagues")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              My Leagues
            </Link>
            <Link
              to="/cast"
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive("/cast")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Cast
            </Link>
            <Link
              to="/how-to-play"
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive("/how-to-play")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              How to Play
            </Link>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2 text-muted-foreground hover:text-primary gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-muted-foreground hover:text-primary gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
