import { AlertTriangle, Clock, ListMusic, Play, Share2, Shuffle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { useColorExtract } from "../hooks/useColorExtract.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useToast } from "../components/common/ToastProvider.jsx";

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { playlists, hydrate, savePlaylist, deletePlaylist } = useLibraryStore();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const showToast = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [sharedPlaylist, setSharedPlaylist] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  // Decode shared playlist if route is shared
  useEffect(() => {
    if (id === "shared") {
      const params = new URLSearchParams(location.search);
      const dataParam = params.get("data");
      if (dataParam) {
        try {
          const jsonStr = decodeURIComponent(
            atob(dataParam)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.name) {
            setSharedPlaylist({
              id: "shared",
              name: parsed.name,
              tracks: parsed.tracks || [],
              isShared: true
            });
            setName(parsed.name);
          }
        } catch (err) {
          console.error("Failed to parse shared playlist", err);
        }
      }
    }
  }, [id, location.search]);

  const playlist = id === "shared" ? sharedPlaylist : playlists.find((p) => p.id === id);

  useEffect(() => {
    if (playlist && id !== "shared") setName(playlist.name);
  }, [playlist, id]);

  if (!playlist) {
    return <p className="text-muted m-0 p-[24px]">{id === "shared" ? "Loading shared playlist..." : "Playlist not found."}</p>;
  }

  const tracks = playlist.tracks || [];
  const artworks = tracks.slice(0, 4).map((t) => t.artworkUrl).filter(Boolean);
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const totalMinutes = Math.round(totalMs / 60000);
  const dominantColor = useColorExtract(artworks[0]);

  function playAll() {
    if (!tracks.length) return;
    setQueue(tracks);
    playTrack(tracks[0], "youtube");
  }

  function shufflePlay() {
    if (!tracks.length) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playTrack(shuffled[0], "youtube");
  }

  function handleRename() {
    if (name.trim() && name.trim() !== playlist.name) {
      savePlaylist({ ...playlist, name: name.trim() });
    }
    setEditing(false);
  }

  function removeTrack(trackId) {
    savePlaylist({
      ...playlist,
      tracks: tracks.filter((t) => t.id !== trackId)
    });
  }

  function handleDelete() {
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deletePlaylist) return;
    await deletePlaylist(playlist.id);
    showToast?.("Playlist deleted");
    navigate("/library");
  }

  function handleShare() {
    if (!tracks.length) return;
    try {
      const payload = {
        name: playlist.name,
        tracks: tracks.map((t) => ({
          id: t.id,
          title: t.title,
          artistName: t.artistName,
          albumName: t.albumName,
          artworkUrl: t.artworkUrl,
          durationMs: t.durationMs,
          videoId: t.videoId,
          previewUrl: t.previewUrl,
          jamendoUrl: t.jamendoUrl
        }))
      };

      const jsonStr = JSON.stringify(payload);
      const base64 = btoa(
        encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );

      const shareUrl = `${window.location.origin}/playlists/shared?data=${base64}`;
      navigator.clipboard.writeText(shareUrl);
      showToast?.("Share link copied to clipboard!");
    } catch (err) {
      console.error("Failed to generate share URL:", err);
      showToast?.("Failed to generate share link.");
    }
  }

  function handleImport() {
    if (!playlist || !tracks.length) return;
    const newId = `playlist-${Date.now()}`;
    savePlaylist({
      id: newId,
      name: playlist.name,
      tracks: tracks
    });
    showToast?.("Saved playlist to your library!");
    navigate(`/playlists/${newId}`);
  }

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const headerClass = "flex flex-col md:flex-row md:items-end gap-[16px] md:gap-[24px] pb-[16px] md:pb-[24px] border-b border-line p-[16px] md:p-0";
  const artBoxClass = "w-[160px] h-[160px] md:w-[232px] md:h-[232px] rounded-[4px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] grid place-items-center bg-[#181e18] overflow-hidden flex-shrink-0 mx-auto md:mx-0";
  const headerInfoClass = "flex flex-col gap-[4px] md:gap-[8px] text-center md:text-left";
  const headerLabelClass = "uppercase text-[0.78rem] font-bold text-ink m-0";
  const headerTitleClass = "text-[clamp(2rem,5vw,4.5rem)] leading-[1.1] font-bold m-0 text-ink truncate cursor-text transition-colors hover:text-accent outline-none";
  const headerMetaClass = "text-muted text-[0.9rem] m-0";
  const controlsRowClass = "flex items-center justify-center md:justify-start gap-[16px] py-[16px] md:py-[24px]";

  const playBtnClass = "w-[56px] h-[56px] inline-grid place-items-center rounded-full bg-accent text-night border-0 cursor-pointer shadow-[0_8px_24px_rgba(30,215,96,0.2)] transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const iconBtnClass = "w-[32px] h-[32px] md:w-[48px] md:h-[48px] inline-grid place-items-center rounded-full bg-transparent border-0 text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] disabled:opacity-50 disabled:cursor-not-allowed";
  const utilityBtnClass = "inline-flex items-center gap-[10px] min-h-[42px] px-[16px] border border-line rounded-full bg-night text-ink font-[800] cursor-pointer transition-colors duration-[160ms] hover:border-[#1ed760] hover:text-[#1ed760]";

  const ntlContainerClass = "w-full text-left";
  const ntlHeaderClass = "grid grid-cols-[36px_1fr_40px] md:grid-cols-[48px_1fr_1fr_48px] gap-[16px] items-center px-[16px] py-[8px] text-muted text-[0.8rem] uppercase font-semibold border-b border-[rgba(255,255,255,0.06)] sticky top-[64px] bg-night z-10";
  const ntlRowContainerClass = "group grid grid-cols-[1fr_auto] items-center px-[16px] py-[10px] border-0 bg-transparent rounded-[6px] transition-colors hover:bg-[rgba(255,255,255,0.08)] w-full";
  const ntlRowClass = "grid grid-cols-[36px_1fr] md:grid-cols-[48px_1fr_1fr_48px] gap-[16px] items-center cursor-pointer text-left w-full border-0 bg-transparent p-0";
  const ntlRemoveBtnClass = "w-[32px] h-[32px] hidden md:inline-grid place-items-center bg-transparent border-0 text-muted cursor-pointer rounded-full opacity-0 group-hover:opacity-100 hover:text-[#ff7777] hover:bg-[rgba(255,119,119,0.1)] transition-all ml-[8px]";

  return (
    <div className={pageStackClass}>
      <header
        className={headerClass}
        style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.45) 0%, transparent 100%)` } : undefined}
      >
        <div className={artBoxClass}>
          {artworks.length >= 4 ? (
            <div className="grid grid-cols-2 w-full h-full">
              {artworks.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          ) : artworks.length > 0 ? (
            <img src={artworks[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <ListMusic size={48} className="text-muted" />
          )}
        </div>
        <div className={headerInfoClass}>
          <span className={headerLabelClass}>Playlist</span>
          {editing && !playlist.isShared ? (
            <input
              className="bg-[rgba(255,255,255,0.1)] border-b border-ink rounded-[4px] text-[clamp(2rem,5vw,4.5rem)] font-bold text-ink outline-none px-[8px] py-[4px] w-full max-w-[500px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          ) : (
            <h1
              className={headerTitleClass}
              onClick={() => !playlist.isShared && setEditing(true)}
              title={playlist.isShared ? "" : "Click to rename"}
            >
              {playlist.name}
            </h1>
          )}
          <span className={headerMetaClass}>
            {tracks.length} song{tracks.length !== 1 ? "s" : ""}
            {totalMinutes > 0 ? `, about ${totalMinutes} min` : ""}
          </span>
        </div>
      </header>

      <div className={controlsRowClass}>
        <button type="button" className={playBtnClass} onClick={playAll} disabled={!tracks.length} aria-label="Play all">
          <Play size={24} fill="currentColor" className="ml-[3px]" />
        </button>
        <button type="button" className={iconBtnClass} onClick={shufflePlay} disabled={!tracks.length} aria-label="Shuffle">
          <Shuffle size={20} />
        </button>

        {tracks.length > 0 && (
          <button type="button" className={iconBtnClass} onClick={handleShare} aria-label="Share playlist" title="Copy share link">
            <Share2 size={20} />
          </button>
        )}

        {!playlist.isShared ? (
          <button type="button" className={iconBtnClass} onClick={handleDelete} aria-label="Delete playlist" style={{ marginLeft: "auto" }}>
            <Trash2 size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center min-h-[36px] px-[16px] rounded-full bg-accent text-night font-bold text-[0.85rem] border-0 cursor-pointer ml-auto"
            onClick={handleImport}
          >
            Save to Library
          </button>
        )}
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,11,10,0.85)] backdrop-blur-[8px]" role="presentation">
          <section
            className="w-[min(400px,calc(100vw-32px))] bg-[#181e18] rounded-[12px] p-[24px] border border-line shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-slide-up flex flex-col items-center gap-[20px] text-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-playlist-title"
            aria-describedby="delete-playlist-copy"
          >
            <div className="w-[56px] h-[56px] rounded-full bg-[rgba(255,119,119,0.1)] text-[#ff7777] grid place-items-center mx-auto" aria-hidden="true">
              <AlertTriangle size={26} />
            </div>
            <div>
              <h2 id="delete-playlist-title" className="m-0 mb-[8px] text-[1.4rem] font-bold text-ink">Delete {playlist.name}?</h2>
              <p id="delete-playlist-copy" className="m-0 text-muted text-[0.95rem] leading-[1.5]">
                This removes the playlist from your library. Your liked songs stay safe.
              </p>
            </div>
            <div className="flex gap-[12px] mt-[8px]">
              <button type="button" className={utilityBtnClass} onClick={() => setDeleteConfirmOpen(false)}>
                Keep playlist
              </button>
              <button type="button" className={`${utilityBtnClass} bg-transparent border-transparent text-[#ff7777] hover:bg-[rgba(255,119,119,0.1)] hover:border-transparent`} onClick={confirmDelete}>
                Delete playlist
              </button>
            </div>
          </section>
        </div>
      )}

      {tracks.length > 0 ? (
        <div className={ntlContainerClass}>
          <div className={ntlHeaderClass}>
            <span className="text-center font-normal">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <span className="text-right flex justify-end hidden md:flex"><Clock size={14} /></span>
          </div>
          {tracks.map((track, index) => {
            const active = currentTrack?.id === track.id;
            return (
              <div key={track.id} className={`${ntlRowContainerClass} ${active ? "bg-[rgba(255,255,255,0.08)]" : ""}`}>
                <button
                  type="button"
                  className={ntlRowClass}
                  onClick={() => {
                    setQueue(tracks);
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
                <span className="hidden md:block text-right text-muted text-[0.85rem] [font-variant-numeric:tabular-nums]">{formatDuration(track.durationMs)}</span>
                </button>
                {!playlist.isShared && (
                  <button type="button" className={ntlRemoveBtnClass} onClick={() => removeTrack(track.id)} aria-label="Remove from playlist">
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted m-0 p-[24px]">Add songs to this playlist from Search.</p>
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
