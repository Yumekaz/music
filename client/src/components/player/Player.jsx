import { Disc3, Heart, ListMusic, Tv2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Equalizer } from "../equalizer/Equalizer.jsx";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { useToast } from "../common/ToastProvider.jsx";
import { useDirectAudio } from "../../hooks/useDirectAudio.js";
import { pauseDirectAudio, playDirectAudio } from "../../lib/directAudio.js";
import { isDirectAudioSource } from "../../lib/resolvers.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { useSettingsStore } from "../../store/settingsStore.js";
import { PlayerControls } from "./PlayerControls.jsx";
import { ProgressBar } from "./ProgressBar.jsx";
import { VolumeControl } from "./VolumeControl.jsx";
import { YouTubeEmbed } from "./YouTubeEmbed.jsx";
import { QueuePanel } from "./QueuePanel.jsx";

const QUALITY_LABELS = {
  default: "Auto",
  small: "240p",
  medium: "360p",
  large: "480p",
  hd720: "720p",
  hd1080: "1080p",
  highres: "4K",
};

export function Player({ online }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [queueOpen, setQueueOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const qualityRef = useRef(null);

  const playbackQuality = useSettingsStore((state) => state.playbackQuality);
  const availableQualities = useSettingsStore((state) => state.youtubeAvailableQualities);
  const setPlaybackQuality = useSettingsStore((state) => state.setPlaybackQuality);

  // Close quality picker on outside click
  useEffect(() => {
    if (!qualityOpen) return;
    function handleClick(e) {
      if (qualityRef.current && !qualityRef.current.contains(e.target)) {
        setQualityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [qualityOpen]);

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
          {sourceType === "youtube" && (
            <div className="quality-picker-wrap" ref={qualityRef}>
              <button
                type="button"
                className={`icon-button icon-button--small quality-btn ${qualityOpen ? "active" : ""}`}
                onClick={() => setQualityOpen(!qualityOpen)}
                aria-label="Video quality"
                title="Video quality"
              >
                <Tv2 size={18} />
              </button>
              {qualityOpen && (
                <div className="quality-menu" role="menu">
                  <div className="quality-menu-label">Quality</div>
                  {(availableQualities.length
                    ? ["default", ...availableQualities.filter((q) => q !== "auto" && QUALITY_LABELS[q])]
                    : Object.keys(QUALITY_LABELS)
                  ).map((q) => (
                    <button
                      key={q}
                      type="button"
                      role="menuitem"
                      className={`quality-menu-item ${playbackQuality === q ? "active" : ""}`}
                      onClick={() => {
                        setPlaybackQuality(q);
                        setQualityOpen(false);
                      }}
                    >
                      {QUALITY_LABELS[q] || q}
                      {playbackQuality === q && <span className="quality-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Equalizer audioRef={audioRef} enabled={directEnabled} />
        </div>
      </footer>
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
