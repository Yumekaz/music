import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

export function PlayerControls({ disabled, isPlaying, onToggle, onNext, onPrevious }) {
  return (
    <div className="player-controls">
      <button type="button" className="icon-button" onClick={onPrevious} disabled={disabled} aria-label="Previous track">
        <SkipBack size={18} aria-hidden="true" />
      </button>
      <button type="button" className="play-button" onClick={onToggle} disabled={disabled} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause size={22} aria-hidden="true" /> : <Play size={22} aria-hidden="true" />}
      </button>
      <button type="button" className="icon-button" onClick={onNext} disabled={disabled} aria-label="Next track">
        <SkipForward size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
