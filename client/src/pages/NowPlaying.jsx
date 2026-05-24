import { ChevronDown, ExternalLink, Heart, ListMusic, ListPlus, MoreVertical, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Equalizer } from "../components/equalizer/Equalizer.jsx";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LyricsPanel } from "../components/lyrics/LyricsPanel.jsx";
import { ProviderBadge } from "../components/common/ProviderBadge.jsx";
import { useToast } from "../components/common/ToastProvider.jsx";
import { Visualizer } from "../components/player/Visualizer.jsx";
import { useColorExtract } from "../hooks/useColorExtract.js";
import { useDirectAudio } from "../hooks/useDirectAudio.js";
import { isDirectAudioSource } from "../lib/resolvers.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { ProgressBar } from "../components/player/ProgressBar.jsx";
import { PlayerControls } from "../components/player/PlayerControls.jsx";
import { VolumeControl } from "../components/player/VolumeControl.jsx";
import { useSettingsStore } from "../store/settingsStore.js";

export default function NowPlaying() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
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
    addToQueue,
    next,
    previous
  } = usePlayerStore();
  const playlists = useLibraryStore((state) => state.playlists);
  const isLiked = useLibraryStore((state) => currentTrack ? state.isLiked(currentTrack.id) : false);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const addToPlaylist = useLibraryStore((state) => state.addToPlaylist);
  const savePlaylist = useLibraryStore((state) => state.savePlaylist);
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
    if (!actionsOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActionsOpen(false);
        setPlaylistPickerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actionsOpen]);

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

  function handleFavorite() {
    if (!currentTrack) return;
    toggleLike(currentTrack).then((liked) => {
      showToast?.(liked ? "Added to Liked Songs" : "Removed from Liked Songs");
    });
  }

  async function handleAddToPlaylist(playlist) {
    if (!currentTrack) return;
    await addToPlaylist(playlist.id, currentTrack);
    showToast?.(`Added to ${playlist.name}`);
    setActionsOpen(false);
    setPlaylistPickerOpen(false);
  }

  async function handleCreatePlaylist() {
    if (!currentTrack) return;
    const id = `playlist-${Date.now()}`;
    const name = `My Playlist #${playlists.length + 1}`;
    await savePlaylist({
      id,
      name,
      tracks: [currentTrack],
      createdAt: Date.now()
    });
    showToast?.(`Created ${name}`);
    setActionsOpen(false);
    setPlaylistPickerOpen(false);
    navigate(`/playlists/${id}`);
  }

  function handleAddToQueue() {
    if (!currentTrack) return;
    addToQueue(currentTrack);
    showToast?.("Added to queue");
    setActionsOpen(false);
  }

  function handleGoToArtist() {
    if (!currentTrack?.artistName) return;
    const slug = currentTrack.artistName.toLowerCase().replace(/\s+/g, "-");
    navigate(`/artists/lastfm-${slug}`);
    setActionsOpen(false);
  }

  function handleCloseActions() {
    setActionsOpen(false);
    setPlaylistPickerOpen(false);
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
        <button
          type="button"
          className="now-playing-more"
          onClick={() => setActionsOpen(true)}
          aria-label="More options"
        >
          <MoreVertical size={24} />
        </button>
      </header>

      <section className="now-media">
        <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="large-artwork" />
      </section>
      <section className="now-details">
        <p>{sourceType === "youtube" ? "YouTube playback" : "Direct audio preview"}</p>
        <div className="now-title-row">
          <div className="now-title-copy">
            <h1>{currentTrack.title}</h1>
            <h2>{currentTrack.artistName}</h2>
          </div>
          <button
            type="button"
            className={`now-favorite-button ${isLiked ? "active" : ""}`}
            onClick={handleFavorite}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
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
      {actionsOpen && (
        <div className="now-sheet-layer" role="presentation">
          <button type="button" className="now-sheet-backdrop" onClick={handleCloseActions} aria-label="Close options" />
          <div className="now-action-sheet" role="dialog" aria-modal="true" aria-label="Track options">
            <div className="now-sheet-grip" />
            <div className="now-sheet-track">
              <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="now-sheet-artwork" />
              <div>
                <strong>{currentTrack.title}</strong>
                <span>{currentTrack.artistName}{currentTrack.albumName ? ` • ${currentTrack.albumName}` : ""}</span>
              </div>
            </div>
            <div className="now-sheet-actions">
              <button type="button" className="now-sheet-action" onClick={handleFavorite}>
                <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                <span>{isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}</span>
              </button>
              <button
                type="button"
                className="now-sheet-action"
                onClick={() => setPlaylistPickerOpen((open) => !open)}
                aria-expanded={playlistPickerOpen}
              >
                <ListPlus size={22} />
                <span>Add to playlist</span>
              </button>
              {playlistPickerOpen && (
                <div className="now-sheet-playlists">
                  <button type="button" className="now-sheet-playlist" onClick={handleCreatePlaylist}>
                    <Plus size={18} />
                    <span>Create playlist</span>
                  </button>
                  {playlists.length ? playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      className="now-sheet-playlist"
                      onClick={() => handleAddToPlaylist(playlist)}
                    >
                      <span>{playlist.name}</span>
                    </button>
                  )) : (
                    <div className="now-sheet-playlist muted">No playlists yet</div>
                  )}
                </div>
              )}
              <button type="button" className="now-sheet-action" onClick={handleAddToQueue}>
                <ListMusic size={22} />
                <span>Add to queue</span>
              </button>
              <button type="button" className="now-sheet-action" onClick={handleGoToArtist}>
                <User size={22} />
                <span>Go to artist</span>
              </button>
              {currentTrack.externalLinks?.youtube && (
                <a className="now-sheet-action" href={currentTrack.externalLinks.youtube} target="_blank" rel="noreferrer">
                  <ExternalLink size={22} />
                  <span>Open source</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      <LyricsPanel track={currentTrack} positionMs={positionMs} />
    </div>
  );
}
