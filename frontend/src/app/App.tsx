import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navigation } from "./components/Navigation";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { CreateLeague } from "./pages/CreateLeague";
import { LeagueOverview } from "./pages/LeagueOverview";
import { RosterPicker } from "./pages/RosterPicker";
import { HowToPlay } from "./pages/HowToPlay";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && <Navigation />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leagues" element={<Home />} />
        <Route path="/leagues/new" element={<CreateLeague />} />
        <Route path="/league/:leagueId" element={<LeagueOverview />} />
        <Route path="/league/:leagueId/pick" element={<RosterPicker />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
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
