import { ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Equalizer } from "../components/equalizer/Equalizer.jsx";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LyricsPanel } from "../components/lyrics/LyricsPanel.jsx";
import { ProviderBadge } from "../components/common/ProviderBadge.jsx";
import { Visualizer } from "../components/player/Visualizer.jsx";
import { useColorExtract } from "../hooks/useColorExtract.js";
import { useDirectAudio } from "../hooks/useDirectAudio.js";
import { isDirectAudioSource } from "../lib/resolvers.js";
import { usePlayerStore } from "../store/playerStore.js";
import { ProgressBar } from "../components/player/ProgressBar.jsx";
import { PlayerControls } from "../components/player/PlayerControls.jsx";
import { VolumeControl } from "../components/player/VolumeControl.jsx";
import { useSettingsStore } from "../store/settingsStore.js";

export default function NowPlaying() {
  const navigate = useNavigate();
  const equalizerOpen = useSettingsStore((state) => state.equalizerOpen);
  const setEqualizerOpen = useSettingsStore((state) => state.setEqualizerOpen);
  const equalizerHistoryPushedRef = useRef(false);
  const {
    currentTrack,
    sourceType,
    isPlaying,
    positionMs,
    durationMs,
    volume,
    setPosition,
    setDuration,
    setVolume,
    seek,
    togglePlay,
    next,
    previous
  } = usePlayerStore();
  const directEnabled = isDirectAudioSource(sourceType);
  const mirrorAudioRef = useDirectAudio({
    track: null,
    sourceType: "preview",
    isPlaying: false,
    volume,
    onTimeUpdate: (position, duration) => {
      setPosition(position);
      setDuration(duration);
    },
    onEnded: next,
    skipSync: true
  });

  const dominantColor = useColorExtract(currentTrack?.artworkUrl);

  useEffect(() => {
    return () => {
      setEqualizerOpen(false);
    };
  }, [setEqualizerOpen]);

  useEffect(() => {
    function handlePopState() {
      if (!equalizerHistoryPushedRef.current || !useSettingsStore.getState().equalizerOpen) return;
      equalizerHistoryPushedRef.current = false;
      setEqualizerOpen(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setEqualizerOpen]);

  useEffect(() => {
    if (!currentTrack) return;

    if (equalizerOpen && !equalizerHistoryPushedRef.current) {
      window.history.pushState(
        { ...(window.history.state || {}), nowPlayingPanel: "equalizer" },
        "",
        window.location.href
      );
      equalizerHistoryPushedRef.current = true;
      return;
    }

    if (!equalizerOpen && equalizerHistoryPushedRef.current) {
      equalizerHistoryPushedRef.current = false;
      window.history.back();
    }
  }, [currentTrack, equalizerOpen]);

  if (!currentTrack) {
    return <Navigate to="/" replace />;
  }

  const disabled = false;

  function handleBack() {
    if (equalizerOpen) {
      setEqualizerOpen(false);
      if (equalizerHistoryPushedRef.current) {
        equalizerHistoryPushedRef.current = false;
        window.history.back();
      }
      return;
    }
    navigate(-1);
  }

  function handleToggle() {
    if (!currentTrack) return;
    togglePlay();
  }

  return (
    <div
      className="now-playing-page"
      style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.35) 0%, #080b0a 60%)` } : undefined}
    >
      <header className="now-playing-header">
        <button type="button" className="now-playing-back" onClick={handleBack} aria-label="Go back">
          <ChevronDown size={28} />
        </button>
        <span className="now-playing-header-title">Now Playing</span>
        <div style={{ width: 28 }} />
      </header>

      <section className="now-media">
        <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="large-artwork" />
      </section>
      <section className="now-details">
        <p>{sourceType === "youtube" ? "YouTube playback" : "Direct audio preview"}</p>
        <h1>{currentTrack.title}</h1>
        <h2>{currentTrack.artistName}</h2>
        <div className="provider-list">
          {Object.entries(currentTrack.externalLinks || {}).map(([provider, href]) => (
            <ProviderBadge key={provider} provider={provider} href={href} />
          ))}
        </div>
        <a className="utility-link" href={currentTrack.externalLinks?.youtube} target="_blank" rel="noreferrer">
          <ExternalLink size={16} aria-hidden="true" />
          <span>Open source</span>
        </a>

        <div className="now-playback-controls">
          <ProgressBar 
            positionMs={positionMs} 
            durationMs={durationMs} 
            onSeek={seek}
          />
          <PlayerControls 
            disabled={disabled} 
            isPlaying={isPlaying} 
            onToggle={handleToggle} 
            onNext={next} 
            onPrevious={previous} 
          />
          <VolumeControl 
            volume={volume} 
            onVolume={setVolume} 
          />
        </div>

        <Equalizer audioRef={mirrorAudioRef} enabled={directEnabled} />
        {directEnabled && <Visualizer />}
      </section>
      <LyricsPanel track={currentTrack} positionMs={positionMs} />
    </div>
  );
}
