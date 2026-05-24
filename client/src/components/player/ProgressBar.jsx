import { formatDuration } from "../../lib/formatters.js";

export function ProgressBar({ positionMs, durationMs, onSeek, variant = "bar" }) {
  const progress = durationMs ? Math.min(positionMs / durationMs, 1) * 100 : 0;
  const isNowPlaying = variant === "now-playing";

  const progressWrapClass = isNowPlaying
    ? "w-full flex items-center gap-[16px] text-muted text-[0.85rem] [font-variant-numeric:tabular-nums] px-[24px]"
    : "flex items-center gap-[12px] text-muted text-[0.78rem] [font-variant-numeric:tabular-nums] w-full max-w-[600px] flex-1";

  // Using inline styles for the range track and thumb to avoid overly complex Tailwind arbitrary variants for range inputs,
  // or we can use generic Tailwind classes for range inputs.
  const rangeClass = `flex-1 h-[4px] rounded-full appearance-none cursor-pointer outline-none bg-line hover:h-[6px] transition-all group ${
    isNowPlaying ? "hover:bg-[rgba(255,255,255,0.15)]" : ""
  }`;

  return (
    <div className={progressWrapClass} onClick={(e) => e.stopPropagation()}>
      <span>{formatDuration(positionMs)}</span>
      <input
        aria-label="Playback progress"
        type="range"
        min="0"
        max={durationMs || 1}
        value={Math.min(positionMs, durationMs || 1)}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        style={{
          "--progress": `${progress}%`,
          background: `linear-gradient(to right, #f5f7f2 var(--progress), #242c24 var(--progress))`
        }}
        className={rangeClass}
      />
      <span>{formatDuration(durationMs)}</span>
    </div>
  );
}
