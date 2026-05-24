import { Outlet, useLocation, NavLink } from "react-router-dom";
import { Home, Library, Search, Settings } from "lucide-react";
import { OfflineBanner } from "./OfflineBanner.jsx";
import { Sidebar } from "../sidebar/Sidebar.jsx";
import { Player } from "../player/Player.jsx";
import { ToastProvider } from "../common/ToastProvider.jsx";
import { ShortcutsHelpModal } from "../common/ShortcutsHelpModal.jsx";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts.js";
import { useBackgroundPlayback } from "../../hooks/useBackgroundPlayback.js";
import { usePWAInstall } from "../../hooks/usePWAInstall.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function AppShell() {
  const online = useOnlineStatus();
  const location = useLocation();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const hasCurrentTrack = Boolean(currentTrack);
  const artworkUrl = currentTrack?.artworkUrl;

  useKeyboardShortcuts();
  useBackgroundPlayback();
  usePWAInstall();

  return (
    <ToastProvider>
      <div className="app-shell" data-route={location.pathname} data-player={hasCurrentTrack ? "active" : "idle"}>
        {artworkUrl && (
          <div className="dynamic-backdrop" aria-hidden="true">
            <div className="backdrop-blob blob-1" style={{ backgroundImage: `url(${artworkUrl})` }} />
            <div className="backdrop-blob blob-2" style={{ backgroundImage: `url(${artworkUrl})` }} />
            <div className="backdrop-overlay" />
          </div>
        )}
        <Sidebar />
        <OfflineBanner online={online} />
        <main className="main-surface">
          <Outlet />
        </main>
        <Player online={online} />
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            {({ isActive }) => (
              <>
                <Home size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Home</span>
              </>
            )}
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""}>
            {({ isActive }) => (
              <>
                <Search size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Search</span>
              </>
            )}
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => isActive ? "active" : ""}>
            {({ isActive }) => (
              <>
                <Library size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Your Library</span>
              </>
            )}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
            {({ isActive }) => (
              <>
                <Settings size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </nav>
        <ShortcutsHelpModal />
      </div>
    </ToastProvider>
  );
}
