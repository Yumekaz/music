import { Clock, Heart, Play, Shuffle } from "lucide-react";
import { useEffect } from "react";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";

export default function Library() {
  const { likedTracks, hydrate } = useLibraryStore();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

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

  const totalMs = likedTracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const totalMinutes = Math.round(totalMs / 60000);

  return (
    <div className="page-stack">
      <header className="liked-header">
        <div className="liked-gradient-icon liked-gradient-icon--large">
          <Heart size={64} fill="white" />
        </div>
        <div className="liked-header-info">
          <span className="liked-label">Playlist</span>
          <h1 className="liked-title">Liked Songs</h1>
          <span className="liked-meta">
            {likedTracks.length} song{likedTracks.length !== 1 ? "s" : ""}
            {totalMinutes > 0 ? `, about ${totalMinutes} min` : ""}
          </span>
        </div>
      </header>

      <div className="liked-controls">
        <button type="button" className="play-button play-button--large" onClick={playAll} disabled={!likedTracks.length} aria-label="Play all">
          <Play size={24} fill="currentColor" />
        </button>
        <button type="button" className="icon-button" onClick={shufflePlay} disabled={!likedTracks.length} aria-label="Shuffle">
          <Shuffle size={20} />
        </button>
      </div>

      {likedTracks.length > 0 ? (
        <div className="numbered-track-list">
          <div className="ntl-header">
            <span className="ntl-num">#</span>
            <span className="ntl-title-col">Title</span>
            <span className="ntl-album">Album</span>
            <span className="ntl-duration"><Clock size={14} /></span>
          </div>
          {likedTracks.map((track, index) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                className={`ntl-row ${active ? "active" : ""}`}
                onClick={() => {
                  setQueue(likedTracks);
                  playTrack(track, "youtube");
                }}
              >
                <span className={`ntl-num ${active && isPlaying ? "playing" : ""}`}>
                  {active && isPlaying ? "♫" : index + 1}
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
            );
          })}
        </div>
      ) : (
        <p className="empty-state">Songs you like will appear here.</p>
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
