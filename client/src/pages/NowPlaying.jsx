import { ChevronDown, ExternalLink, Heart, ListMusic, ListPlus, MoreVertical, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const pageClass = "mx-auto grid min-h-[100svh] w-full max-w-[760px] gap-[24px] px-[20px] pb-[32px] pt-[12px] text-ink md:max-w-[920px] md:px-[32px] md:pt-[28px]";
  const headerClass = "grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-[12px]";
  const headerButtonClass = "inline-grid h-[44px] w-[44px] place-items-center rounded-full border-0 bg-transparent text-ink transition-colors hover:bg-[rgba(255,255,255,0.08)] active:scale-95";
  const headerTitleClass = "text-center text-[0.78rem] font-bold uppercase tracking-[0.16em] text-muted";
  const mediaClass = "grid place-items-center";
  const artworkClass = "aspect-square w-full max-w-[min(76vw,420px)] rounded-[10px] object-cover shadow-[0_28px_74px_rgba(0,0,0,0.56)] md:max-w-[430px]";
  const detailsClass = "grid gap-[18px] text-center";
  const sourceLabelClass = "m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-accent";
  const titleRowClass = "grid grid-cols-[minmax(0,1fr)_48px] items-center gap-[12px] text-left";
  const titleCopyClass = "min-w-0 text-center md:text-left";
  const favoriteButtonClass = `inline-grid h-[48px] w-[48px] place-items-center rounded-full border border-line bg-night text-ink transition-colors hover:border-accent hover:text-accent active:scale-95 ${
    isLiked ? "border-accent text-accent" : ""
  }`;
  const providerListClass = "flex flex-wrap justify-center gap-[8px] md:justify-start";
  const utilityLinkClass = "mx-auto inline-flex min-h-[42px] items-center justify-center gap-[10px] rounded-full border border-line bg-night px-[16px] text-[0.92rem] font-bold text-ink transition-colors hover:border-accent hover:text-accent md:mx-0";
  const controlsClass = "mx-auto grid w-full max-w-[580px] gap-[20px]";
  const sheetLayerClass = "fixed inset-0 z-[900] flex items-end justify-center";
  const sheetBackdropClass = "absolute inset-0 border-0 bg-[rgba(0,0,0,0.72)] backdrop-blur-[6px]";
  const actionSheetClass = "relative z-[1] max-h-[86svh] w-full max-w-[560px] overflow-y-auto rounded-t-[22px] border border-line bg-[#1b211b] p-[20px] shadow-[0_-22px_64px_rgba(0,0,0,0.55)] animate-slide-up";
  const sheetActionClass = "flex min-h-[52px] w-full items-center gap-[16px] rounded-[10px] border-0 bg-transparent px-[8px] text-left text-[1rem] font-semibold text-ink transition-colors hover:bg-[rgba(255,255,255,0.07)] active:scale-[0.99]";
  const sheetPlaylistClass = "ml-[38px] flex min-h-[42px] w-[calc(100%-38px)] items-center gap-[12px] rounded-[8px] border-0 bg-[rgba(255,255,255,0.04)] px-[12px] text-left text-[0.92rem] text-ink transition-colors hover:bg-[rgba(255,255,255,0.08)]";

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
      className={pageClass}
      style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.35) 0%, #080b0a 60%)` } : undefined}
    >
      <header className={headerClass}>
        <button type="button" className={headerButtonClass} onClick={handleBack} aria-label="Go back">
          <ChevronDown size={28} />
        </button>
        <span className={headerTitleClass}>Now Playing</span>
        <button
          type="button"
          className={headerButtonClass}
          onClick={() => setActionsOpen(true)}
          aria-label="More options"
        >
          <MoreVertical size={24} />
        </button>
      </header>

      <section className={mediaClass}>
        <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className={artworkClass} />
      </section>
      <section className={detailsClass}>
        <p className={sourceLabelClass}>{sourceType === "youtube" ? "YouTube playback" : "Direct audio preview"}</p>
        <div className={titleRowClass}>
          <div className={titleCopyClass}>
            <h1 className="m-0 text-[clamp(2rem,8vw,3.7rem)] leading-[1.05] font-bold">{currentTrack.title}</h1>
            <h2 className="m-0 mt-[10px] text-[1.2rem] font-semibold text-[#d8ded6]">{currentTrack.artistName}</h2>
          </div>
          <button
            type="button"
            className={favoriteButtonClass}
            onClick={handleFavorite}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
        <div className={providerListClass}>
          {Object.entries(currentTrack.externalLinks || {}).map(([provider, href]) => (
            <ProviderBadge key={provider} provider={provider} href={href} />
          ))}
        </div>
        <a className={utilityLinkClass} href={currentTrack.externalLinks?.youtube} target="_blank" rel="noreferrer">
          <ExternalLink size={16} aria-hidden="true" />
          <span>Open source</span>
        </a>

        <div className={controlsClass}>
          <ProgressBar
            positionMs={positionMs}
            durationMs={durationMs || currentTrack?.durationMs || 0}
            onSeek={seek}
            variant="now-playing"
          />
          <PlayerControls
            disabled={disabled}
            isPlaying={isPlaying}
            onToggle={handleToggle}
            onNext={next}
            onPrevious={previous}
            variant="now-playing"
          />
          <VolumeControl
            volume={volume}
            onVolume={setVolume}
            variant="now-playing"
          />
        </div>

        <Equalizer audioRef={mirrorAudioRef} enabled={directEnabled} />
        {directEnabled && <Visualizer />}
      </section>
      {actionsOpen && createPortal((
        <div className={sheetLayerClass} role="presentation">
          <button type="button" className={sheetBackdropClass} onClick={handleCloseActions} aria-label="Close options" />
          <div className={actionSheetClass} role="dialog" aria-modal="true" aria-label="Track options">
            <div className="mx-auto mb-[18px] h-[4px] w-[46px] rounded-full bg-[rgba(255,255,255,0.35)]" />
            <div className="mb-[16px] flex items-center gap-[14px] border-b border-line pb-[16px]">
              <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="h-[56px] w-[56px] rounded-[6px] object-cover" />
              <div className="grid min-w-0 gap-[3px]">
                <strong className="truncate text-[1rem]">{currentTrack.title}</strong>
                <span className="truncate text-[0.88rem] text-muted">{currentTrack.artistName}{currentTrack.albumName ? ` • ${currentTrack.albumName}` : ""}</span>
              </div>
            </div>
            <div className="grid gap-[4px]">
              <button type="button" className={sheetActionClass} onClick={handleFavorite}>
                <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                <span>{isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}</span>
              </button>
              <button
                type="button"
                className={sheetActionClass}
                onClick={() => setPlaylistPickerOpen((open) => !open)}
                aria-expanded={playlistPickerOpen}
              >
                <ListPlus size={22} />
                <span>Add to playlist</span>
              </button>
              {playlistPickerOpen && (
                <div className="grid gap-[6px] pb-[8px]">
                  <button type="button" className={sheetPlaylistClass} onClick={handleCreatePlaylist}>
                    <Plus size={18} />
                    <span>Create playlist</span>
                  </button>
                  {playlists.length ? playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      className={sheetPlaylistClass}
                      onClick={() => handleAddToPlaylist(playlist)}
                    >
                      <span>{playlist.name}</span>
                    </button>
                  )) : (
                    <div className={`${sheetPlaylistClass} text-muted`}>No playlists yet</div>
                  )}
                </div>
              )}
              <button type="button" className={sheetActionClass} onClick={handleAddToQueue}>
                <ListMusic size={22} />
                <span>Add to queue</span>
              </button>
              <button type="button" className={sheetActionClass} onClick={handleGoToArtist}>
                <User size={22} />
                <span>Go to artist</span>
              </button>
              {currentTrack.externalLinks?.youtube && (
                <a className={sheetActionClass} href={currentTrack.externalLinks.youtube} target="_blank" rel="noreferrer">
                  <ExternalLink size={22} />
                  <span>Open source</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
      <LyricsPanel track={currentTrack} positionMs={positionMs} />
    </div>
  );
}
