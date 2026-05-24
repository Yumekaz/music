import { Clock, Heart, Play, Shuffle, Sparkles, ArrowLeft, Loader2, Plus, ListMusic } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { apiPost } from "../services/api.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export default function Library() {
  const { likedTracks, playlists, hydrate, savePlaylist } = useLibraryStore();
  const navigate = useNavigate();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const showToast = useToast();

  const [smartTracks, setSmartTracks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [smartTitle, setSmartTitle] = useState("Smart Mix");
  const [activeView, setActiveView] = useState("library");

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  function playAll() {
    if (!likedTracks.length) return;
    setQueue(likedTracks);
    playTrack(likedTracks[0], "youtube");
  }

  function shufflePlay() {
    if (!likedTracks.length) return;
    const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playTrack(shuffled[0], "youtube");
  }

  async function generateSmartPlaylist() {
    if (!likedTracks.length) {
      showToast?.("Like some tracks first to seed recommendations!");
      return;
    }
    setGenerating(true);
    try {
      const artists = [...new Set(likedTracks.map((t) => t.artistName).filter(Boolean))];
      const seedArtists = artists.sort(() => Math.random() - 0.5).slice(0, 5);

      const response = await apiPost("/discovery/recommendations", { artists: seedArtists });
      const sections = response.sections || [];

      const recTracks = [];
      const seenIds = new Set();
      sections.forEach((sec) => {
        (sec.tracks || []).forEach((t) => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            recTracks.push(t);
          }
        });
      });

      if (recTracks.length === 0) {
        showToast?.("No recommendations found. Try liking more tracks!");
      } else {
        setSmartTracks(recTracks);
        const seedStr = seedArtists.slice(0, 2).join(" & ");
        setSmartTitle(seedStr ? `Mix: ${seedStr}` : "Smart Mix");
        showToast?.("Generated custom smart playlist!");
      }
    } catch (err) {
      showToast?.("Failed to generate smart playlist.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveSmartPlaylist() {
    if (!smartTracks.length) return;
    try {
      await savePlaylist({
        id: `playlist-${Date.now()}`,
        name: smartTitle,
        tracks: smartTracks,
        createdAt: Date.now()
      });
      showToast?.(`Saved "${smartTitle}" to library`);
    } catch (err) {
      showToast?.("Failed to save playlist.");
    }
  }

  async function createPlaylist() {
    const id = `playlist-${Date.now()}`;
    const name = `My Playlist #${playlists.length + 1}`;
    try {
      await savePlaylist({
        id,
        name,
        tracks: [],
        createdAt: Date.now()
      });
      showToast?.(`Created ${name}`);
      navigate(`/playlists/${id}`);
    } catch (err) {
      showToast?.("Failed to create playlist.");
    }
  }

  const totalMs = likedTracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const totalMinutes = Math.round(totalMs / 60000);

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const headerClass = "flex items-end gap-[24px] pb-[24px] border-b border-line";
  const headerInfoClass = "flex flex-col gap-[8px]";
  const headerLabelClass = "uppercase text-[0.78rem] font-bold text-ink m-0";
  const headerTitleClass = "text-[clamp(2rem,5vw,4.5rem)] leading-none font-bold m-0 text-ink";
  const headerMetaClass = "text-muted text-[0.9rem] m-0";
  const controlsRowClass = "flex items-center gap-[16px] py-[24px]";

  const playBtnClass = "w-[56px] h-[56px] inline-grid place-items-center rounded-full bg-accent text-night border-0 cursor-pointer shadow-[0_8px_24px_rgba(30,215,96,0.2)] transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const iconBtnClass = "w-[32px] h-[32px] md:w-[48px] md:h-[48px] inline-grid place-items-center rounded-full bg-transparent border-0 text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-50 disabled:cursor-not-allowed";
  const utilityBtnClass = "inline-flex items-center gap-[10px] min-h-[42px] px-[16px] border border-line rounded-full bg-night text-ink font-[800] cursor-pointer transition-colors duration-[160ms] hover:border-[#1ed760] hover:text-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed";

  const collectionGridClass = "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[24px]";
  const collectionCardClass = "flex flex-col gap-[16px] p-[16px] rounded-[8px] bg-[#101510] border-0 text-left cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-[4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]";
  const artBoxClass = "w-full aspect-square rounded-[8px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] grid place-items-center";

  const ntlContainerClass = "w-full text-left";
  const ntlHeaderClass = "grid grid-cols-[36px_1fr_40px] md:grid-cols-[48px_1fr_1fr_48px] gap-[16px] items-center px-[16px] py-[8px] text-muted text-[0.8rem] uppercase font-semibold border-b border-[rgba(255,255,255,0.06)] sticky top-[64px] bg-night z-10";
  const ntlRowClass = "group grid grid-cols-[36px_1fr_40px] md:grid-cols-[48px_1fr_1fr_48px] gap-[16px] items-center px-[16px] py-[10px] border-0 bg-transparent rounded-[6px] cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.08)] text-left w-full";

  if (activeView === "library" && smartTracks.length === 0) {
    return (
      <div className={pageStackClass}>
        <header className="flex items-center justify-between pb-[24px] border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <span className={headerLabelClass}>Collection</span>
            <h1 className="text-[2rem] font-bold m-0 mt-[4px]">Your Library</h1>
          </div>
          <button type="button" className="inline-flex items-center gap-[8px] min-h-[36px] px-[16px] bg-ink text-night rounded-full font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={createPlaylist}>
            <Plus size={18} />
            <span>Create</span>
          </button>
        </header>

        <section className={collectionGridClass} aria-label="Library collections">
          <button type="button" className={collectionCardClass} onClick={() => setActiveView("liked")}>
            <div className={`${artBoxClass} bg-gradient-to-br from-[#450af5] to-[#c4efd9]`}>
              <Heart size={48} fill="white" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <strong className="text-ink text-[1.1rem]">Liked Songs</strong>
              <span className="text-muted text-[0.85rem]">Playlist • {likedTracks.length} song{likedTracks.length !== 1 ? "s" : ""}</span>
            </div>
          </button>

          {playlists.map((playlist) => {
            const artworks = (playlist.tracks || []).slice(0, 4).map((track) => track.artworkUrl).filter(Boolean);
            return (
              <Link key={playlist.id} className={collectionCardClass} to={`/playlists/${playlist.id}`} style={{textDecoration: 'none'}}>
                <div className={`${artBoxClass} bg-[#181e18]`}>
                  {artworks.length >= 4 ? (
                    <div className="grid grid-cols-2 w-full h-full">
                      {artworks.slice(0, 4).map((url, index) => (
                        <img key={`${url}-${index}`} src={url} alt="" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  ) : artworks.length > 0 ? (
                    <img src={artworks[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic size={40} className="text-muted" />
                  )}
                </div>
                <div className="flex flex-col gap-[4px]">
                  <strong className="text-ink text-[1.1rem] truncate">{playlist.name}</strong>
                  <span className="text-muted text-[0.85rem]">Playlist • {playlist.tracks?.length || 0} song{(playlist.tracks?.length || 0) !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            );
          })}

          <button type="button" className={`${collectionCardClass} border border-dashed border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]`} onClick={createPlaylist}>
            <div className={`${artBoxClass} bg-[rgba(255,255,255,0.03)] shadow-none`}>
              <Plus size={48} className="text-muted" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <strong className="text-ink text-[1.1rem]">Create playlist</strong>
              <span className="text-muted text-[0.85rem]">Start an empty playlist</span>
            </div>
          </button>
        </section>
      </div>
    );
  }

  if (smartTracks.length > 0) {
    const totalSmartMs = smartTracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
    const totalSmartMinutes = Math.round(totalSmartMs / 60000);

    return (
      <div className={pageStackClass}>
        <header className={headerClass}>
          <button type="button" className={`${iconBtnClass} mb-auto mt-[4px] bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)]`} onClick={() => setSmartTracks([])} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="w-[120px] h-[120px] md:w-[232px] md:h-[232px] rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] grid place-items-center bg-gradient-to-br from-[#ff007f] to-[#ffaa00]">
            <Sparkles size={64} fill="white" />
          </div>
          <div className={headerInfoClass}>
            <span className={headerLabelClass}>Smart Recommendations</span>
            <h1 className={headerTitleClass}>{smartTitle}</h1>
            <span className={headerMetaClass}>
              {smartTracks.length} tracks, about {totalSmartMinutes} min
            </span>
          </div>
        </header>

        <div className={controlsRowClass}>
          <button
            type="button"
            className={playBtnClass}
            onClick={() => {
              setQueue(smartTracks);
              playTrack(smartTracks[0], "youtube");
            }}
            aria-label="Play all"
          >
            <Play size={24} fill="currentColor" className="ml-[3px]" />
          </button>

          <button
            type="button"
            className={utilityBtnClass}
            onClick={handleSaveSmartPlaylist}
            title="Save mix to Playlists"
          >
            <Plus size={16} />
            <span>Save to Playlists</span>
          </button>
        </div>

        <div className={ntlContainerClass}>
          <div className={ntlHeaderClass}>
            <span className="text-center font-normal">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <span className="text-right flex justify-end"><Clock size={14} /></span>
          </div>
          {smartTracks.map((track, index) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                className={`${ntlRowClass} ${active ? "bg-[rgba(255,255,255,0.08)]" : ""}`}
                onClick={() => {
                  setQueue(smartTracks);
                  playTrack(track, "youtube");
                }}
              >
                <span className={`text-center text-muted font-normal text-[0.95rem] ${active && isPlaying ? "text-accent" : ""}`}>
                  <span className="group-hover:hidden">{active && isPlaying ? "♫" : index + 1}</span>
                  <Play size={14} fill="currentColor" className="hidden group-hover:inline-block text-ink" />
                </span>
                <div className="flex items-center gap-[12px] min-w-0">
                  <ImageWithFallback src={track.artworkUrl} alt={track.title} className="w-[40px] h-[40px] rounded-[4px] object-cover flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[0.95rem] truncate ${active ? "text-accent font-semibold" : "text-ink"}`}>{track.title}</span>
                    <span className="text-muted text-[0.85rem] truncate">{track.artistName}</span>
                  </div>
                </div>
                <span className="hidden md:block text-muted text-[0.85rem] truncate">{track.albumName || ""}</span>
                <span className="text-right text-muted text-[0.85rem] [font-variant-numeric:tabular-nums]">{formatDuration(track.durationMs)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={pageStackClass}>
      <header className={headerClass}>
        <button type="button" className={`${iconBtnClass} mb-auto mt-[4px] bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)]`} onClick={() => setActiveView("library")} aria-label="Back to library">
          <ArrowLeft size={22} />
        </button>
        <div className="w-[120px] h-[120px] md:w-[232px] md:h-[232px] rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] grid place-items-center bg-gradient-to-br from-[#450af5] to-[#c4efd9]">
          <Heart size={64} fill="white" />
        </div>
        <div className={headerInfoClass}>
          <span className={headerLabelClass}>Playlist</span>
          <h1 className={headerTitleClass}>Liked Songs</h1>
          <span className={headerMetaClass}>
            {likedTracks.length} song{likedTracks.length !== 1 ? "s" : ""}
            {totalMinutes > 0 ? `, about ${totalMinutes} min` : ""}
          </span>
        </div>
      </header>

      <div className={controlsRowClass}>
        <button type="button" className={playBtnClass} onClick={playAll} disabled={!likedTracks.length} aria-label="Play all">
          <Play size={24} fill="currentColor" className="ml-[3px]" />
        </button>
        <button type="button" className={iconBtnClass} onClick={shufflePlay} disabled={!likedTracks.length} aria-label="Shuffle">
          <Shuffle size={20} />
        </button>
        <button
          type="button"
          className={utilityBtnClass}
          onClick={generateSmartPlaylist}
          disabled={generating || !likedTracks.length}
          title="Generate personalized recommendations mix"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{generating ? "Generating..." : "Smart Mix"}</span>
        </button>
      </div>

      {likedTracks.length > 0 ? (
        <div className={ntlContainerClass}>
          <div className={ntlHeaderClass}>
            <span className="text-center font-normal">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <span className="text-right flex justify-end"><Clock size={14} /></span>
          </div>
          {likedTracks.map((track, index) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                className={`${ntlRowClass} ${active ? "bg-[rgba(255,255,255,0.08)]" : ""}`}
                onClick={() => {
                  setQueue(likedTracks);
                  playTrack(track, "youtube");
                }}
              >
                <span className={`text-center text-muted font-normal text-[0.95rem] ${active && isPlaying ? "text-accent" : ""}`}>
                  <span className="group-hover:hidden">{active && isPlaying ? "♫" : index + 1}</span>
                  <Play size={14} fill="currentColor" className="hidden group-hover:inline-block text-ink" />
                </span>
                <div className="flex items-center gap-[12px] min-w-0">
                  <ImageWithFallback src={track.artworkUrl} alt={track.title} className="w-[40px] h-[40px] rounded-[4px] object-cover flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[0.95rem] truncate ${active ? "text-accent font-semibold" : "text-ink"}`}>{track.title}</span>
                    <span className="text-muted text-[0.85rem] truncate">{track.artistName}</span>
                  </div>
                </div>
                <span className="hidden md:block text-muted text-[0.85rem] truncate">{track.albumName || ""}</span>
                <span className="text-right text-muted text-[0.85rem] [font-variant-numeric:tabular-nums]">{formatDuration(track.durationMs)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-muted m-0 p-[24px]">Songs you like will appear here.</p>
      )}
    </div>
  );
}

function formatDuration(ms) {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
