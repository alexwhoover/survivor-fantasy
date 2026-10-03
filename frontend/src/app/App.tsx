import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { Navigation } from "./components/Navigation";
import { Leagues } from "./pages/Leagues";
import { LeagueOverview } from "./pages/LeagueOverview";
import { HowToPlay } from "./pages/HowToPlay";
import { AdminLogin } from "./pages/AdminLogin";
import { CreateLeague } from "./pages/CreateLeague";

/** Every page shares the nav bar — there are no gated areas of the site. */
function Layout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

/**
 * The only gate left. Visitors aren't "logged out" — they're the intended audience —
 * so the few admin-only pages send them home rather than to a login form.
 */
function RequireAdmin() {
  const { isAdmin, loading } = useAdmin();
  if (loading) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background isolate">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Leagues />} />
          <Route path="/league/:leagueId" element={<LeagueOverview />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin/new-league" element={<CreateLeague />} />
          </Route>
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </BrowserRouter>
  );
}
