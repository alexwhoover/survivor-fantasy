import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import torchIcon from "../../assets/torch.png";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { logout } from "../../api";

// Only ever rendered inside the authenticated layout, so a valid session is guaranteed.
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    setUser(null);
    navigate("/");
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-md transition-colors ${
      isActive(path)
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <nav className="relative border-b border-border bg-card shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 flex-nowrap items-center justify-between">
          <Link to="/leagues" className="flex items-center gap-3" aria-label="Home">
            <img src={torchIcon} alt="" className="h-10 w-auto" />
            <span className="text-xl font-semibold text-foreground">Survivor Fantasy</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            <Link to="/leagues" className={navLinkClass("/leagues")}>
              My Leagues
            </Link>
            <Link to="/how-to-play" className={navLinkClass("/how-to-play")}>
              How to Play
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="ml-2 text-muted-foreground hover:text-primary gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile hamburger toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile nav panel */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-card shadow-lg md:hidden">
            <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
              <Link
                to="/leagues"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex min-h-[44px] items-center ${navLinkClass("/leagues")}`}
              >
                My Leagues
              </Link>
              <Link
                to="/how-to-play"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex min-h-[44px] items-center ${navLinkClass("/how-to-play")}`}
              >
                How to Play
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="min-h-[44px] justify-start gap-2 text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
