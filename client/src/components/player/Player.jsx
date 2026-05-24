import { Disc3, Heart, ListMusic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { useToast } from "../common/ToastProvider.jsx";
import { useDirectAudio } from "../../hooks/useDirectAudio.js";
import { useQueuePreflight } from "../../hooks/useQueuePreflight.js";
import { getPlayerReadinessMessage } from "../../lib/queuePreflight.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { PlayerControls } from "./PlayerControls.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { VolumeControl } from "./VolumeControl.jsx";
import { YouTubeEmbed } from "./YouTubeEmbed.jsx";
import { QueuePanel } from "./QueuePanel.jsx";
import { useMediaSession } from "../../hooks/useMediaSession.js";

export function Player({ online }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [queueOpen, setQueueOpen] = useState(false);
  const lastToastIdRef = useRef(null);

  useMediaSession();
  useQueuePreflight({ online });

  const {
    currentTrack,
    sourceType,
    isPlaying,
    positionMs,
    durationMs,
    volume,
    playbackFailure,
    queueReadiness,
    pause,
    togglePlay,
    seek,
    setDuration,
    setVolume,
    next,
    previous,
    getNextTrack
  } = usePlayerStore();

  const isLiked = useLibraryStore((state) => currentTrack ? state.isLiked(currentTrack.id) : false);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const recordHistory = useLibraryStore((state) => state.recordHistory);

  const onTimeUpdate = useCallback(
    (nextPosition, nextDuration) => {
      usePlayerStore.getState().setPosition(nextPosition);
      if (Number.isFinite(nextDuration)) setDuration(nextDuration);
    },
    [setDuration]
  );
  useDirectAudio({
    track: currentTrack,
    sourceType,
    isPlaying: online && isPlaying,
    volume,
    onTimeUpdate,
    onEnded: next
  });

  useEffect(() => {
    if (!currentTrack || !isPlaying) return;
    recordHistory(currentTrack).catch(() => {});
  }, [currentTrack, isPlaying, recordHistory]);

  useEffect(() => {
    if (!online && isPlaying) pause();
  }, [isPlaying, online, pause]);

  useEffect(() => {
    if (!playbackFailure?.message || playbackFailure.id === lastToastIdRef.current) return;
    lastToastIdRef.current = playbackFailure.id;
    showToast?.(playbackFailure.message);
  }, [playbackFailure, showToast]);

  if (!currentTrack) return null;

  const disabled = !online;

  function handleToggle() {
    if (!currentTrack) return;
    togglePlay();
  }

  function handleLike() {
    if (!currentTrack) return;
    toggleLike(currentTrack).then((liked) => {
      showToast?.(liked ? "Added to Liked Songs" : "Removed from Liked Songs");
    });
  }

  const handleBarClick = (e) => {
    if (window.innerWidth <= 768 && currentTrack) {
      navigate("/now-playing");
    }
  };

  const currentReadiness = currentTrack ? queueReadiness[currentTrack.id] : null;
  const readinessMessage = getPlayerReadinessMessage(currentReadiness);
  const failureMessage =
    playbackFailure?.trackId && playbackFailure.trackId !== currentTrack?.id
      ? ""
      : playbackFailure?.message || "";
  const statusMessage = !online ? "Connect to internet to play" : readinessMessage || failureMessage;

  const playerBarClass = "fixed bottom-[calc(58px+env(safe-area-inset-bottom,8px)+8px)] left-[8px] right-[8px] w-[calc(100%-16px)] h-[64px] min-h-[64px] rounded-[12px] bg-[rgba(12,16,15,0.9)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] grid grid-cols-[44px_minmax(0,1fr)_auto] grid-rows-auto [grid-template-areas:'art_meta_controls'] px-[14px] pl-[10px] gap-[12px] z-30 md:bottom-0 md:left-[280px] md:right-0 md:w-auto md:h-auto md:min-h-[112px] md:rounded-none md:bg-[rgba(8,11,10,0.95)] md:backdrop-blur-[18px] md:border-t md:border-x-0 md:border-b-0 md:border-line md:shadow-none md:grid-cols-[92px_minmax(140px,280px)_1fr_minmax(180px,auto)] md:[grid-template-areas:none] md:py-[10px] md:px-[18px] md:gap-[20px] md:items-center";
  const playerMediaClass = "w-[44px] h-[44px] min-w-[44px] rounded-[6px] md:w-[92px] md:h-[92px] md:min-w-[92px] md:rounded-[8px] [grid-area:art] md:[grid-area:auto] cursor-pointer overflow-hidden";
  const mediaContentClass = "w-full h-full object-cover";
  const playerMetaClass = "min-w-0 flex flex-col justify-center gap-[1px] md:gap-[4px] [grid-area:meta] md:[grid-area:auto]";
  const playerMetaRowClass = "flex items-center gap-[8px] md:gap-[16px] min-w-0";
  const playerTitleClass = "text-[0.9rem] md:text-[1.15rem] font-bold truncate text-left border-0 bg-transparent p-0 text-ink cursor-pointer hover:underline";
  const heartClass = `hidden sm:inline-grid w-[28px] h-[28px] md:w-[32px] md:h-[32px] place-items-center rounded-full border-0 bg-transparent text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] ${isLiked ? "text-accent" : ""}`;
  const playerWorkspaceClass = "hidden md:flex flex-col items-center gap-[12px] flex-1 min-w-[300px] max-w-[800px]";
  const playerToolsClass = "hidden md:flex items-center gap-[16px] justify-end min-w-[180px]";

  return (
    <>
      <footer className={playerBarClass} aria-label="Persistent player" onClick={handleBarClick}>
        <div className={playerMediaClass} onClick={() => currentTrack && navigate("/now-playing")} role="button" tabIndex={0}>
          {currentTrack && sourceType === "youtube" ? (
            <YouTubeEmbed track={currentTrack} nextVideoId={getNextTrack()?.videoId} isPlaying={online && isPlaying} className={mediaContentClass} />
          ) : currentTrack ? (
            <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className={mediaContentClass} />
          ) : (
            <div className={`grid place-items-center bg-[#181e18] text-muted ${mediaContentClass}`}>
              <Disc3 size={28} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className={playerMetaClass}>
          <div className={playerMetaRowClass}>
            <button type="button" className={playerTitleClass} onClick={() => currentTrack && navigate("/now-playing")}>
              {currentTrack?.title || "Choose a track"}
            </button>
            <button type="button" className={heartClass} onClick={(e) => { e.stopPropagation(); handleLike(); }} aria-label={isLiked ? "Unlike" : "Like"}>
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
          <span className="text-muted text-[0.8rem] md:text-[0.85rem] truncate">{currentTrack?.artistName || "Search or play from Home"}</span>
          {statusMessage ? <strong className="text-[#ff7777] font-semibold text-[0.7rem] md:text-[0.75rem] truncate">{statusMessage}</strong> : null}
        </div>
        <div className={playerWorkspaceClass}>
          <PlayerControls disabled={disabled} isPlaying={online && isPlaying} onToggle={handleToggle} onNext={next} onPrevious={previous} />
          <ProgressBar positionMs={positionMs} durationMs={durationMs || currentTrack?.durationMs || 0} onSeek={seek} />
        </div>
        <div className="flex md:hidden [grid-area:controls] items-center gap-[12px] pr-[4px]">
          <PlayerControls compact disabled={disabled} isPlaying={online && isPlaying} onToggle={handleToggle} onNext={next} onPrevious={previous} />
        </div>
        <div className={playerToolsClass}>
          <VolumeControl volume={volume} onVolume={setVolume} />
          <button type="button" className={`w-[32px] h-[32px] inline-grid place-items-center rounded-full border-0 bg-transparent text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] ${queueOpen ? "text-ink bg-[rgba(255,255,255,0.07)]" : ""}`} onClick={(e) => { e.stopPropagation(); setQueueOpen(!queueOpen); }} aria-label="Toggle queue">
            <ListMusic size={18} />
          </button>
        </div>
      </footer>
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
