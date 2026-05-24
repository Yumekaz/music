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
  const isNowPlayingRoute = location.pathname === "/now-playing";

  useKeyboardShortcuts();
  useBackgroundPlayback();
  usePWAInstall();

  const navItemClass = ({ isActive }) =>
    `flex flex-col items-center gap-[4px] text-[0.68rem] px-[12px] py-[4px] ${isActive ? "text-ink" : "text-muted"}`;

  return (
    <ToastProvider>
      <div className="min-h-[100svh] grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] bg-night group" data-route={location.pathname} data-player={hasCurrentTrack ? "active" : "idle"}>
        {artworkUrl && (
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-[1500ms] ease-in-out bg-night opacity-0 group-data-[player=active]:opacity-100" aria-hidden="true">
            <div className="absolute w-[140vmax] h-[140vmax] bg-cover bg-center blur-[120px] saturate-[180%] opacity-[0.18] rounded-full mix-blend-screen top-[-45%] left-[-45%] animate-float-blob-1" style={{ backgroundImage: `url(${artworkUrl})` }} />
            <div className="absolute w-[140vmax] h-[140vmax] bg-cover bg-center blur-[120px] saturate-[180%] opacity-[0.18] rounded-full mix-blend-screen bottom-[-45%] right-[-45%] animate-float-blob-2" style={{ backgroundImage: `url(${artworkUrl})` }} />
            <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_50%,rgba(8,11,10,0.4)_0%,rgba(8,11,10,0.88)_100%)]" />
          </div>
        )}
        <Sidebar />
        <OfflineBanner online={online} />
        <main className={`min-w-0 overflow-x-hidden relative z-10 pt-[22px] px-[16px] pb-[160px] group-data-[player=idle]:pb-[86px] md:p-[28px] md:pb-[150px] group-data-[player=idle]:md:pb-[28px] [&>*]:animate-page-in ${isNowPlayingRoute ? "!pb-[24px] md:!pb-[28px]" : ""}`}>
          <Outlet />
        </main>
        {!isNowPlayingRoute && <Player online={online} />}
        <nav className={`${isNowPlayingRoute ? "hidden" : "flex"} md:hidden fixed bottom-0 left-0 right-0 bg-night border-t border-line py-[8px] pb-[env(safe-area-inset-bottom,8px)] z-[600] justify-around`} aria-label="Mobile navigation">
          <NavLink to="/" end className={navItemClass}>
            {({ isActive }) => (
              <>
                <Home size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Home</span>
              </>
            )}
          </NavLink>
          <NavLink to="/search" className={navItemClass}>
            {({ isActive }) => (
              <>
                <Search size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Search</span>
              </>
            )}
          </NavLink>
          <NavLink to="/library" className={navItemClass}>
            {({ isActive }) => (
              <>
                <Library size={24} strokeWidth={2.5} fill={isActive ? "currentColor" : "none"} />
                <span>Your Library</span>
              </>
            )}
          </NavLink>
          <NavLink to="/settings" className={navItemClass}>
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
