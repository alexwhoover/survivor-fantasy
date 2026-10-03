import { Link, useLocation, useNavigate } from "react-router-dom";
import torchIcon from "../../assets/torch.png";
import { Lock, LogOut, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useAdmin } from "../context/AdminContext";
import { adminLogout } from "../../api";

/**
 * Two links for everyone, plus the admin's controls when signed in. There are few
 * enough destinations to show them all inline at every width, so there's no menu to
 * open — the whole bar fits a phone.
 */
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, setIsAdmin } = useAdmin();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await adminLogout();
    setIsAdmin(false);
    navigate("/");
  };

  const navLinkClass = (path: string) =>
    `rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-4 sm:py-2 ${
      isActive(path)
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <nav className="border-b border-border bg-card shadow-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Home">
          <img src={torchIcon} alt="" className="h-8 w-auto shrink-0 sm:h-10" />
          {/* The full name needs room a phone doesn't have next to the nav links. */}
          <span className="truncate text-base font-semibold text-foreground sm:text-xl">
            <span className="sm:hidden">Survivor</span>
            <span className="hidden sm:inline">Survivor Fantasy</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link to="/" className={navLinkClass("/")}>
            Leagues
          </Link>
          <Link to="/how-to-play" className={navLinkClass("/how-to-play")}>
            How to Play
          </Link>

          {isAdmin ? (
            <>
              <Link to="/admin/new-league" aria-label="New league">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Sign out of admin"
                className="text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            /* Unobtrusive on purpose: visitors have no reason to sign in, but the admin
               needs a way back in that isn't a memorised URL. */
            <Link to="/admin/login" aria-label="Admin sign-in">
              <Button variant="ghost" size="icon" className="text-muted-foreground/40 hover:text-primary">
                <Lock className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
