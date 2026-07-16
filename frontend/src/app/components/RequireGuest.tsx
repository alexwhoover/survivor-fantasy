import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Keeps authenticated users off the login page — visiting "/" while already
 * signed in bounces straight to My Leagues instead of showing the form again.
 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/leagues" replace />;
  }

  return <>{children}</>;
}
