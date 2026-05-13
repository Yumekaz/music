import { Outlet, useLocation, NavLink } from "react-router-dom";
import { Home, Library, Search, Settings } from "lucide-react";
import { OfflineBanner } from "./OfflineBanner.jsx";
import { Sidebar } from "../sidebar/Sidebar.jsx";
import { Player } from "../player/Player.jsx";
import { ToastProvider } from "../common/ToastProvider.jsx";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function AppShell() {
  const online = useOnlineStatus();
  const location = useLocation();
  const hasCurrentTrack = usePlayerStore((state) => Boolean(state.currentTrack));

  useKeyboardShortcuts();

  return (
    <ToastProvider>
      <div className="app-shell" data-route={location.pathname} data-player={hasCurrentTrack ? "active" : "idle"}>
        <Sidebar />
        <OfflineBanner online={online} />
        <main className="main-surface">
          <Outlet />
        </main>
        <Player online={online} />
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""}>
            <Search size={20} />
            <span>Search</span>
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => isActive ? "active" : ""}>
            <Library size={20} />
            <span>Library</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>
    </ToastProvider>
  );
}
