import { WifiOff } from "lucide-react";

export function OfflineBanner({ online }) {
  if (online) return null;

  return (
    <div className="offline-banner">
      <WifiOff size={16} aria-hidden="true" />
      <span>Offline. Library, artwork, and cached lyrics stay available. Connect to internet to play.</span>
    </div>
  );
}
