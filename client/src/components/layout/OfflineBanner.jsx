import { WifiOff } from "lucide-react";

export function OfflineBanner({ online }) {
  if (online) return null;

  return (
    <div className="fixed z-50 top-[14px] right-[18px] max-w-[min(540px,calc(100vw-36px))] min-h-[42px] px-[14px] py-[8px] border border-[#3b3322] rounded-lg text-[#ffd68a] bg-[#1b160d] flex items-center gap-[8px]">
      <WifiOff size={16} aria-hidden="true" className="flex-shrink-0" />
      <span className="text-[0.8rem] leading-tight">Offline. Library, artwork, and cached lyrics stay available. Connect to internet to play.</span>
    </div>
  );
}
