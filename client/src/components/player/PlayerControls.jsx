import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore.js";

export function PlayerControls({ disabled, isPlaying, onToggle, onNext, onPrevious, variant = "bar", compact = false, mobile = false }) {
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);

  const isNowPlaying = variant === "now-playing";
  const isCompact = compact || mobile;

  const containerClass = isNowPlaying
    ? "w-full max-w-[480px] flex items-center justify-between mx-auto"
    : isCompact
      ? "flex items-center gap-[12px]"
      : "flex items-center gap-[12px] md:gap-[16px]";

  const iconBtnClass = (active) => {
    if (isNowPlaying) {
      return `w-[48px] h-[48px] inline-grid place-items-center rounded-full border-0 bg-transparent cursor-pointer transition-colors ${active ? "text-accent" : "text-muted hover:text-ink hover:bg-[rgba(255,255,255,0.08)]"} disabled:opacity-45 disabled:cursor-not-allowed`;
    }
    return `w-[32px] h-[32px] inline-grid place-items-center rounded-full border-0 bg-transparent cursor-pointer transition-colors ${active ? "text-accent" : "text-muted hover:text-ink hover:bg-[rgba(255,255,255,0.07)]"} disabled:opacity-45 disabled:cursor-not-allowed`;
  };

  const skipBtnClass = isNowPlaying
    ? "w-[56px] h-[56px] inline-grid place-items-center rounded-full border-0 bg-transparent text-ink cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
    : "w-[32px] h-[32px] inline-grid place-items-center rounded-full border-0 bg-transparent text-ink cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-45 disabled:cursor-not-allowed";

  const playBtnClass = isNowPlaying
    ? `w-[72px] h-[72px] inline-grid place-items-center rounded-full border-0 bg-ink text-night cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_8px_24px_rgba(30,215,96,0.2)] disabled:opacity-45 disabled:cursor-not-allowed ${isBuffering ? "animate-pulse" : ""}`
    : `w-[36px] h-[36px] inline-grid place-items-center rounded-full border-0 bg-ink text-night cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed ${isBuffering ? "animate-pulse" : ""}`;

  return (
    <div className={containerClass} onClick={(e) => e.stopPropagation()}>
      {!isCompact && (
        <button
          type="button"
          className={iconBtnClass(shuffle)}
          onClick={toggleShuffle}
          disabled={disabled}
          aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        >
          <Shuffle size={isNowPlaying ? 22 : 16} aria-hidden="true" />
        </button>
      )}

      {!isCompact && (
        <button type="button" className={skipBtnClass} onClick={onPrevious} disabled={disabled || isBuffering} aria-label="Previous track">
          <SkipBack size={isNowPlaying ? 28 : 18} aria-hidden="true" fill={isNowPlaying ? "currentColor" : "none"} />
        </button>
      )}

      <button
        type="button"
        className={playBtnClass}
        onClick={onToggle}
        disabled={disabled}
        aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
      >
        {isBuffering ? (
          <span className={`block rounded-full border-2 border-night border-t-transparent animate-spin ${isNowPlaying ? "w-[24px] h-[24px]" : "w-[16px] h-[16px]"}`} aria-hidden="true" />
        ) : isPlaying ? (
          <Pause size={isNowPlaying ? 32 : 20} aria-hidden="true" fill="currentColor" />
        ) : (
          <Play size={isNowPlaying ? 32 : 20} aria-hidden="true" fill="currentColor" className="ml-[2px]" />
        )}
      </button>

      <button type="button" className={skipBtnClass} onClick={onNext} disabled={disabled || isBuffering} aria-label="Next track">
        <SkipForward size={isNowPlaying ? 28 : 18} aria-hidden="true" fill={isNowPlaying ? "currentColor" : "none"} />
      </button>

      {!isCompact && (
        <button
          type="button"
          className={iconBtnClass(repeat !== "off")}
          onClick={cycleRepeat}
          disabled={disabled}
          aria-label={`Repeat: ${repeat}`}
        >
          {repeat === "one" ? (
            <Repeat1 size={isNowPlaying ? 22 : 16} aria-hidden="true" />
          ) : (
            <Repeat size={isNowPlaying ? 22 : 16} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
