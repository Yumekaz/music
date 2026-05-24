import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore.js";

export function PlayerControls({ disabled, isPlaying, onToggle, onNext, onPrevious, minimal }) {
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);

  return (
    <div className={`player-controls ${minimal ? "minimal-controls" : ""}`} onClick={(e) => e.stopPropagation()}>
      {!minimal && (
        <button
          type="button"
          className={`icon-button icon-button--small ${shuffle ? "active" : ""}`}
          onClick={toggleShuffle}
          disabled={disabled}
          aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        >
          <Shuffle size={16} aria-hidden="true" />
        </button>
      )}

      {!minimal && (
        <button type="button" className="icon-button" onClick={onPrevious} disabled={disabled || isBuffering} aria-label="Previous track">
          <SkipBack size={18} aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        className={`play-button ${isBuffering ? "buffering" : ""}`}
        onClick={onToggle}
        disabled={disabled}
        aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
      >
        {isBuffering ? (
          <span className="buffering-spinner" aria-hidden="true" />
        ) : isPlaying ? (
          <Pause size={22} aria-hidden="true" />
        ) : (
          <Play size={22} aria-hidden="true" />
        )}
      </button>

      {!minimal && (
        <button type="button" className="icon-button" onClick={onNext} disabled={disabled || isBuffering} aria-label="Next track">
          <SkipForward size={18} aria-hidden="true" />
        </button>
      )}

      {!minimal && (
        <button
          type="button"
          className={`icon-button icon-button--small ${repeat !== "off" ? "active" : ""}`}
          onClick={cycleRepeat}
          disabled={disabled}
          aria-label={`Repeat: ${repeat}`}
        >
          {repeat === "one" ? (
            <Repeat1 size={16} aria-hidden="true" />
          ) : (
            <Repeat size={16} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
