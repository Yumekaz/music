import { Outlet, useLocation } from "react-router-dom";
import { OfflineBanner } from "./OfflineBanner.jsx";
import { Sidebar } from "../sidebar/Sidebar.jsx";
import { Player } from "../player/Player.jsx";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

export function AppShell() {
  const online = useOnlineStatus();
  const location = useLocation();

  return (
    <div className="app-shell" data-route={location.pathname}>
      <Sidebar />
      <OfflineBanner online={online} />
      <main className="main-surface">
        <Outlet />
      </main>
      <Player online={online} />
    </div>
  );
}
