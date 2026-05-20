import { formatDuration } from "../../lib/formatters.js";

export function ProgressBar({ positionMs, durationMs, onSeek }) {
  const progress = durationMs ? Math.min(positionMs / durationMs, 1) * 100 : 0;

  return (
    <div className="progress-wrap" onClick={(e) => e.stopPropagation()}>
      <span>{formatDuration(positionMs)}</span>
      <input
        aria-label="Playback progress"
        type="range"
        min="0"
        max={durationMs || 1}
        value={Math.min(positionMs, durationMs || 1)}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        style={{ "--progress": `${progress}%` }}
      />
      <span>{formatDuration(durationMs)}</span>
    </div>
  );
}
