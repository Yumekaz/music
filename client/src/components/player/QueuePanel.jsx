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

  let statusClass = "text-muted border-[#2c352c] bg-[rgba(255,255,255,0.04)]";
  if (status === QUEUE_READINESS.READY) {
    statusClass = "text-accent border-[rgba(30,215,96,0.35)] bg-[rgba(30,215,96,0.08)]";
  } else if (status === QUEUE_READINESS.FOREGROUND_ONLY) {
    statusClass = "text-[#f0c56a] border-[rgba(240,197,106,0.35)] bg-[rgba(240,197,106,0.08)]";
  } else if (
    [
      QUEUE_READINESS.MISSING_VIDEO,
      QUEUE_READINESS.MISSING_PREVIEW,
      QUEUE_READINESS.PROVIDER_TIMEOUT,
      QUEUE_READINESS.OFFLINE,
      QUEUE_READINESS.UNAVAILABLE,
    ].includes(status)
  ) {
    statusClass = "text-[#ff8a8a] border-[rgba(255,138,138,0.35)] bg-[rgba(255,138,138,0.08)]";
  }

  const badgeClass = `inline-flex items-center gap-[4px] min-w-max max-w-[118px] px-[7px] py-[3px] border rounded-full text-[0.68rem] font-bold whitespace-nowrap ${statusClass}`;

  return (
    <span className={badgeClass} title={readiness?.reason || label}>
      {readinessIcon(status)}
      <span className="overflow-hidden text-ellipsis">{label}</span>
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

  const panelClass = "fixed right-0 bottom-[80px] w-full max-w-[380px] max-h-[calc(100vh-120px)] bg-[#141914] border border-line rounded-t-[12px] overflow-y-auto z-[500] shadow-[-4px_0_24px_rgba(0,0,0,0.5)] animate-slide-up";
  const headerClass = "flex items-center justify-between px-[20px] pt-[16px] pb-[8px] sticky top-0 bg-[#141914] z-[1]";
  const sectionClass = "px-[20px] pt-[8px] pb-[16px]";
  const sectionLabelClass = "block text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted mb-[8px]";

  const getItemClass = (isDragging, isDragOver, isActive) => {
    let base = "flex items-center gap-[12px] py-[6px] rounded-[6px] cursor-grab transition-all duration-150 group active:cursor-grabbing";
    if (isDragging) base += " opacity-30 scale-95 bg-[rgba(255,255,255,0.05)]";
    if (isDragOver) base += " border-t-2 border-[#1db954] rounded-none";
    if (isActive) base += " text-accent";
    return base;
  };

  const artClass = "w-[40px] h-[40px] rounded-[4px] object-cover shrink-0";
  const infoClass = "flex-1 min-w-0 grid gap-[2px]";
  const titleClass = "text-[0.85rem] font-medium overflow-hidden whitespace-nowrap text-ellipsis";
  const artistClass = "text-[0.75rem] text-muted";

  const smallIconBtnClass = "w-[32px] h-[32px] inline-flex items-center justify-center rounded-full border-0 bg-transparent text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] md:hidden group-hover:inline-flex";

  return (
    <div className={panelClass}>
      <header className={headerClass}>
        <h3 className="m-0 text-[1rem] font-bold">Queue</h3>
        <button type="button" className={smallIconBtnClass} onClick={onClose} aria-label="Close queue">
          <X size={18} />
        </button>
      </header>

      {currentTrack && (
        <div className={sectionClass}>
          <span className={sectionLabelClass}>Now Playing</span>
          <div className={getItemClass(false, false, true)}>
            <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className={artClass} />
            <div className={infoClass}>
              <span className={titleClass}>{currentTrack.title}</span>
              <span className={artistClass}>{currentTrack.artistName}</span>
            </div>
            <ReadinessBadge readiness={queueReadiness[currentTrack.id]} />
            <PlayingBars isPlaying={isPlaying} isBuffering={isBuffering} />
          </div>
        </div>
      )}

      <div className={`${sectionClass} animate-slide-up`}>
        <span className={sectionLabelClass}>Next Up</span>
        {upNext.length > 0 ? (
          upNext.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className={getItemClass(draggedIndex === i, dragOverIndex === i, false)}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, i)}
            >
              <ImageWithFallback src={track.artworkUrl} alt={track.title} className={artClass} />
              <div className={infoClass}>
                <span className={titleClass}>{track.title}</span>
                <span className={artistClass}>{track.artistName}</span>
              </div>
              <ReadinessBadge readiness={queueReadiness[track.id]} />
              <button
                type="button"
                className={smallIconBtnClass}
                onClick={() => playTrack(track, "youtube")}
                aria-label={`Play ${track.title}`}
              >
                <Play size={14} />
              </button>
              <button
                type="button"
                className={smallIconBtnClass}
                onClick={() => removeFromQueue(track.id)}
                aria-label="Remove from queue"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-muted text-[0.82rem] py-[8px]">Queue is empty. Songs will appear here as you play.</p>
        )}
      </div>
    </div>
  );
}
