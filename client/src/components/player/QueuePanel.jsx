import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Play, Smartphone, WifiOff, X } from "lucide-react";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { PlayingBars } from "../common/PlayingBars.jsx";
import { usePlayerStore } from "../../store/playerStore.js";
import { QUEUE_READINESS, getReadinessLabel } from "../../lib/queuePreflight.js";

function readinessIcon(status) {
  switch (status) {
    case QUEUE_READINESS.READY:
      return <CheckCircle2 size={13} />;
    case QUEUE_READINESS.FOREGROUND_ONLY:
      return <Smartphone size={13} />;
    case QUEUE_READINESS.PROVIDER_TIMEOUT:
      return <Clock3 size={13} />;
    case QUEUE_READINESS.OFFLINE:
      return <WifiOff size={13} />;
    case QUEUE_READINESS.MISSING_VIDEO:
    case QUEUE_READINESS.MISSING_PREVIEW:
    case QUEUE_READINESS.UNAVAILABLE:
      return <AlertTriangle size={13} />;
    default:
      return <Clock3 size={13} />;
  }
}

function ReadinessBadge({ readiness }) {
  const status = readiness?.status || "unknown";
  const label = getReadinessLabel(status);

  return (
    <span className={`queue-readiness queue-readiness--${status}`} title={readiness?.reason || label}>
      {readinessIcon(status)}
      <span>{label}</span>
    </span>
  );
}

export function QueuePanel({ open, onClose }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const queue = usePlayerStore((state) => state.queue);
  const queueReadiness = usePlayerStore((state) => state.queueReadiness);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!open) return null;

  const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const upNext = currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue;

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const offset = currentIndex >= 0 ? currentIndex + 1 : 0;
    const fromGlobal = offset + draggedIndex;
    const toGlobal = offset + targetIndex;

    const reorderQueue = usePlayerStore.getState().reorderQueue;
    reorderQueue(fromGlobal, toGlobal);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
            <ReadinessBadge readiness={queueReadiness[currentTrack.id]} />
            <PlayingBars isPlaying={isPlaying} isBuffering={isBuffering} />
          </div>
        </div>
      )}

      <div className="queue-section animate-slide-in">
        <span className="queue-label">Next Up</span>
        {upNext.length > 0 ? (
          upNext.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className={`queue-item ${draggedIndex === i ? "dragging" : ""} ${dragOverIndex === i ? "drag-over" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, i)}
            >
              <ImageWithFallback src={track.artworkUrl} alt={track.title} className="queue-art" />
              <div className="queue-info">
                <span className="queue-title">{track.title}</span>
                <span className="queue-artist">{track.artistName}</span>
              </div>
              <ReadinessBadge readiness={queueReadiness[track.id]} />
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
