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
    // Only navigate to Now Playing on mobile viewports when clicking non-interactive areas
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

  return (
    <>
      <footer 
        className="player-bar" 
        aria-label="Persistent player"
        onClick={handleBarClick}
      >
        <div className="player-media" onClick={() => currentTrack && navigate("/now-playing")} role="button" tabIndex={0}>
          {currentTrack && sourceType === "youtube" ? (
            <YouTubeEmbed 
              track={currentTrack} 
              nextVideoId={getNextTrack()?.videoId}
              isPlaying={online && isPlaying} 
              className="mini-youtube" 
            />
          ) : currentTrack ? (
            <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="mini-artwork" />
          ) : (
            <div className="mini-empty">
              <Disc3 size={28} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="player-meta">
          <div className="player-meta-row">
            <button type="button" className="player-title" onClick={() => currentTrack && navigate("/now-playing")}>
              {currentTrack?.title || "Choose a track"}
            </button>
            <button
              type="button"
              className={`icon-button icon-button--small player-heart ${isLiked ? "liked" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
          <span>{currentTrack?.artistName || "Search or play from Home"}</span>
          {statusMessage ? <strong>{statusMessage}</strong> : null}
        </div>
        <div className="player-workspace">
          <PlayerControls
            disabled={disabled}
            isPlaying={online && isPlaying}
            onToggle={handleToggle}
            onNext={next}
            onPrevious={previous}
          />
          <ProgressBar
            positionMs={positionMs}
            durationMs={durationMs || currentTrack?.durationMs || 0}
            onSeek={seek}
          />
        </div>
        <div className="player-tools">
          <VolumeControl volume={volume} onVolume={setVolume} />
          <button
            type="button"
            className={`icon-button icon-button--small ${queueOpen ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setQueueOpen(!queueOpen);
            }}
            aria-label="Toggle queue"
          >
            <ListMusic size={18} />
          </button>
        </div>
      </footer>
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
