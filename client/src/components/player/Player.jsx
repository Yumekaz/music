import { Disc3, Heart, ListMusic } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Equalizer } from "../equalizer/Equalizer.jsx";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { useToast } from "../common/ToastProvider.jsx";
import { useDirectAudio } from "../../hooks/useDirectAudio.js";
import { pauseDirectAudio, playDirectAudio } from "../../lib/directAudio.js";
import { isDirectAudioSource } from "../../lib/resolvers.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { PlayerControls } from "./PlayerControls.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { VolumeControl } from "./VolumeControl.jsx";
import { YouTubeEmbed } from "./YouTubeEmbed.jsx";
import { QueuePanel } from "./QueuePanel.jsx";

export function Player({ online }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [queueOpen, setQueueOpen] = useState(false);
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
    previous
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
      const title = encodeURIComponent(currentTrack.title || "");
      const artist = encodeURIComponent(currentTrack.artistName || currentTrack.artist || "");
      if (!title) return;

      fetch(`/api/tracks/resolve?title=${title}&artist=${artist}`)
        .then((res) => res.json())
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
        .catch(console.error);
    }
  }, [currentTrack, sourceType]);

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

  return (
    <>
      <footer className="player-bar" aria-label="Persistent player">
        <div className="player-media" onClick={() => currentTrack && navigate("/now-playing")} role="button" tabIndex={0}>
          {currentTrack && sourceType === "youtube" ? (
            <YouTubeEmbed track={currentTrack} isPlaying={online && isPlaying} className="mini-youtube" />
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
              onClick={handleLike}
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
              if (directEnabled) {
                const audio = document.getElementById("direct-audio-player");
                if (audio) audio.currentTime = pos / 1000;
              } else {
                usePlayerStore.getState().setSeekTarget(pos);
              }
            }}
          />
        </div>
        <div className="player-tools">
          <VolumeControl volume={volume} onVolume={setVolume} />
          <button
            type="button"
            className={`icon-button icon-button--small ${queueOpen ? "active" : ""}`}
            onClick={() => setQueueOpen(!queueOpen)}
            aria-label="Toggle queue"
          >
            <ListMusic size={18} />
          </button>
          <Equalizer audioRef={audioRef} enabled={directEnabled} />
        </div>
      </footer>
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
