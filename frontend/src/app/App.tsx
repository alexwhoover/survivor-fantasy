import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navigation } from "./components/Navigation";
import { RequireAuth } from "./components/RequireAuth";
import { RequireGuest } from "./components/RequireGuest";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { CreateLeague } from "./pages/CreateLeague";
import { LeagueOverview } from "./pages/LeagueOverview";
import { RosterPicker } from "./pages/RosterPicker";
import { HowToPlay } from "./pages/HowToPlay";

/** Every authenticated page shares the nav bar. */
function AuthenticatedLayout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

/** Sends stray/unknown paths wherever the visitor actually belongs. */
function CatchAll() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/leagues" : "/"} replace />;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route
          path="/"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route element={<RequireAuth />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/leagues" element={<Home />} />
            <Route path="/leagues/new" element={<CreateLeague />} />
            <Route path="/league/:leagueId" element={<LeagueOverview />} />
            <Route path="/league/:leagueId/pick" element={<RosterPicker />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
          </Route>
        </Route>
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
