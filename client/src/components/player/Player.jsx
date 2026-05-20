import { Disc3, Heart, ListMusic } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { useToast } from "../common/ToastProvider.jsx";
import { useDirectAudio } from "../../hooks/useDirectAudio.js";
import { pauseDirectAudio, playDirectAudio, prefetchDirectAudioSource } from "../../lib/directAudio.js";
import { isDirectAudioSource } from "../../lib/resolvers.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { PlayerControls } from "./PlayerControls.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { VolumeControl } from "./VolumeControl.jsx";
import { YouTubeEmbed } from "./YouTubeEmbed.jsx";
import { QueuePanel } from "./QueuePanel.jsx";
import { useMediaSession } from "../../hooks/useMediaSession.js";
import { resolveTrack } from "../../services/tracks.js";

export function Player({ online }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [queueOpen, setQueueOpen] = useState(false);

  useMediaSession();

  const {
    currentTrack,
    sourceType,
    isPlaying,
    positionMs,
    durationMs,
    volume,
    pause,
    resume,
    togglePlay,
    setPosition,
    setDuration,
    setVolume,
    next,
    previous,
    getNextTrack
  } = usePlayerStore();

  const isLiked = useLibraryStore((state) => currentTrack ? state.isLiked(currentTrack.id) : false);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const recordHistory = useLibraryStore((state) => state.recordHistory);
  const directEnabled = isDirectAudioSource(sourceType);

  const onTimeUpdate = useCallback(
    (nextPosition, nextDuration) => {
      setPosition(nextPosition);
      if (Number.isFinite(nextDuration)) setDuration(nextDuration);
    },
    [setDuration, setPosition]
  );
  const audioRef = useDirectAudio({
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
    if (currentTrack && sourceType === "youtube" && !currentTrack.videoId) {
      const title = currentTrack.title || "";
      const artist = currentTrack.artistName || currentTrack.artist || "";
      if (!title) return;

      resolveTrack(title, artist)
        .then((resolvedTrack) => {
          if (resolvedTrack && resolvedTrack.videoId) {
            usePlayerStore.setState((state) => {
              if (state.currentTrack?.id === currentTrack.id) {
                return { currentTrack: { ...state.currentTrack, ...resolvedTrack } };
              }
              return state;
            });
          }
        })
        .catch((err) => {
          console.warn("Failed to resolve track:", title, artist, err);
        });
    }
  }, [currentTrack, sourceType]);

  // Prefetch next track direct URL if it's a direct source to avoid background transition pause in Chrome mobile
  useEffect(() => {
    const nextTrack = getNextTrack();
    if (nextTrack) {
      const nextSourceType = nextTrack.videoId ? "youtube" : (sourceType === "youtube" ? "preview" : sourceType);
      if (isDirectAudioSource(nextSourceType)) {
        prefetchDirectAudioSource(nextTrack, nextSourceType).catch(() => {});
      }
    }
  }, [currentTrack, sourceType, getNextTrack]);

  if (!currentTrack) return null;

  const disabled = !online;

  async function handleToggle() {
    if (!currentTrack) return;
    if (directEnabled) {
      if (isPlaying) {
        pauseDirectAudio();
        pause();
        return;
      }
      try {
        await playDirectAudio(currentTrack, sourceType);
      } catch (err) {
        console.warn("Playback of direct audio failed:", err);
        showToast?.("Could not play preview track.");
      } finally {
        resume();
      }
      return;
    }
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
          {!online ? <strong>Connect to internet to play</strong> : null}
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
            onSeek={(pos) => {
              setPosition(pos);
              usePlayerStore.getState().setSeekTarget(pos);
            }}
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
