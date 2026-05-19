import { ListMusic, Play, X } from "lucide-react";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { PlayingBars } from "../common/PlayingBars.jsx";
import { usePlayerStore } from "../../store/playerStore.js";

export function QueuePanel({ open, onClose }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const queue = usePlayerStore((state) => state.queue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);

  if (!open) return null;

  const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const upNext = currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue;

  return (
    <div className="queue-panel">
      <header className="queue-header">
        <h3>Queue</h3>
        <button type="button" className="icon-button icon-button--small" onClick={onClose} aria-label="Close queue">
          <X size={18} />
        </button>
      </header>

      {currentTrack && (
        <div className="queue-section">
          <span className="queue-label">Now Playing</span>
          <div className="queue-item active">
            <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="queue-art" />
            <div className="queue-info">
              <span className="queue-title">{currentTrack.title}</span>
              <span className="queue-artist">{currentTrack.artistName}</span>
            </div>
            <PlayingBars isPlaying={isPlaying} isBuffering={isBuffering} />
          </div>
        </div>
      )}

      <div className="queue-section">
        <span className="queue-label">Next Up</span>
        {upNext.length > 0 ? (
          upNext.map((track, i) => (
            <div key={`${track.id}-${i}`} className="queue-item">
              <ImageWithFallback src={track.artworkUrl} alt={track.title} className="queue-art" />
              <div className="queue-info">
                <span className="queue-title">{track.title}</span>
                <span className="queue-artist">{track.artistName}</span>
              </div>
              <button
                type="button"
                className="icon-button icon-button--small queue-play"
                onClick={() => playTrack(track, "youtube")}
                aria-label={`Play ${track.title}`}
              >
                <Play size={14} />
              </button>
              <button
                type="button"
                className="icon-button icon-button--small queue-remove"
                onClick={() => removeFromQueue(track.id)}
                aria-label="Remove from queue"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="queue-empty">Queue is empty. Songs will appear here as you play.</p>
        )}
      </div>
    </div>
  );
}
