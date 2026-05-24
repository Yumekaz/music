import { Volume2 } from "lucide-react";

export function VolumeControl({ volume, onVolume, variant = "bar" }) {
  const isNowPlaying = variant === "now-playing";

  const volumeControlClass = isNowPlaying
    ? "hidden md:flex items-center gap-[12px] justify-center w-full max-w-[360px] mx-auto text-[rgba(245,247,242,0.6)]"
    : "grid grid-cols-[18px_auto_90px] items-center gap-[8px] text-muted";

  const volumeLabelClass = isNowPlaying
    ? "hidden"
    : "text-muted text-[0.72rem] font-bold whitespace-nowrap";

  const rangeClass = isNowPlaying
    ? "flex-1 h-[4px] rounded-[2px] appearance-none cursor-pointer outline-none"
    : "w-[90px] h-[4px] rounded-[2px] appearance-none cursor-pointer outline-none";

  return (
    <label className={volumeControlClass} title="App Volume" onClick={(e) => e.stopPropagation()}>
      <Volume2 size={isNowPlaying ? 20 : 16} aria-hidden="true" />
      <span className={volumeLabelClass}>App Volume</span>
      <input
        aria-label="App Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(event) => onVolume(Number(event.target.value))}
        style={{
          "--volume-percent": `${volume * 100}%`,
          background: isNowPlaying
            ? `linear-gradient(to right, #f5f7f2 var(--volume-percent), rgba(255, 255, 255, 0.1) var(--volume-percent))`
            : `linear-gradient(to right, #f5f7f2 var(--volume-percent), #242c24 var(--volume-percent))`
        }}
        className={rangeClass}
      />
    </label>
  );
}
