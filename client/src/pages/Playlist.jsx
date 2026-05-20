import { Clock, ListMusic, Pause, Play, Share2, Shuffle, Trash2 } from "lucide-react";
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
    return <p className="empty-state">{id === "shared" ? "Loading shared playlist..." : "Playlist not found."}</p>;
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
    if (deletePlaylist) {
      deletePlaylist(playlist.id);
      navigate("/library");
    }
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

  return (
    <div className="page-stack">
      <header
        className="playlist-header"
        style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.45) 0%, transparent 100%)` } : undefined}
      >
        <div className="playlist-header-art">
          {artworks.length >= 4 ? (
            <div className="playlist-mosaic">
              {artworks.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" />
              ))}
            </div>
          ) : artworks.length > 0 ? (
            <img src={artworks[0]} alt="" className="playlist-single-art" />
          ) : (
            <div className="playlist-empty-art">
              <ListMusic size={48} />
            </div>
          )}
        </div>
        <div className="playlist-header-info">
          <span className="liked-label">Playlist</span>
          {editing && !playlist.isShared ? (
            <input
              className="playlist-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          ) : (
            <h1
              className="playlist-name"
              onClick={() => !playlist.isShared && setEditing(true)}
              title={playlist.isShared ? "" : "Click to rename"}
            >
              {playlist.name}
            </h1>
          )}
          <span className="liked-meta">
            {tracks.length} song{tracks.length !== 1 ? "s" : ""}
            {totalMinutes > 0 ? `, about ${totalMinutes} min` : ""}
          </span>
        </div>
      </header>

      <div className="liked-controls">
        <button type="button" className="play-button play-button--large" onClick={playAll} disabled={!tracks.length} aria-label="Play all">
          <Play size={24} fill="currentColor" />
        </button>
        <button type="button" className="icon-button" onClick={shufflePlay} disabled={!tracks.length} aria-label="Shuffle">
          <Shuffle size={20} />
        </button>

        {tracks.length > 0 && (
          <button type="button" className="icon-button" onClick={handleShare} aria-label="Share playlist" title="Copy share link">
            <Share2 size={20} />
          </button>
        )}

        {!playlist.isShared ? (
          <button type="button" className="icon-button" onClick={handleDelete} aria-label="Delete playlist" style={{ marginLeft: "auto" }}>
            <Trash2 size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="play-button"
            style={{ marginLeft: "auto", fontSize: "0.85rem", height: "36px", padding: "0 16px", borderRadius: "18px" }}
            onClick={handleImport}
          >
            Save to Library
          </button>
        )}
      </div>

      {tracks.length > 0 ? (
        <div className="numbered-track-list">
          <div className="ntl-header">
            <span className="ntl-num">#</span>
            <span className="ntl-title-col">Title</span>
            <span className="ntl-album">Album</span>
            <span className="ntl-duration"><Clock size={14} /></span>
          </div>
          {tracks.map((track, index) => {
            const active = currentTrack?.id === track.id;
            return (
              <div key={track.id} className={`ntl-row ${active ? "active" : ""}`}>
                <button
                  type="button"
                  className="ntl-row-play"
                  onClick={() => {
                    setQueue(tracks);
                    playTrack(track, "youtube");
                  }}
                >
                  <span className={`ntl-num ${active && isPlaying ? "playing" : ""}`}>
                    <span className="ntl-num-text">{active && isPlaying ? "♫" : index + 1}</span>
                    <Play size={14} className="ntl-play-icon" />
                  </span>
                  <div className="ntl-track">
                    <ImageWithFallback src={track.artworkUrl} alt={track.title} className="ntl-art" />
                    <div className="ntl-track-info">
                      <span className={`ntl-track-title ${active ? "active" : ""}`}>{track.title}</span>
                      <span className="ntl-track-artist">{track.artistName}</span>
                    </div>
                  </div>
                  <span className="ntl-album">{track.albumName || ""}</span>
                  <span className="ntl-duration">{formatDuration(track.durationMs)}</span>
                </button>
                {!playlist.isShared && (
                  <button type="button" className="ntl-remove" onClick={() => removeTrack(track.id)} aria-label="Remove from playlist">
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">Add songs to this playlist from Search.</p>
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
