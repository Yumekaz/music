import { useEffect, useRef, useState } from "react";
import { Heart, ListMusic, ListPlus, Play, MoreHorizontal, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { useToast } from "../common/ToastProvider.jsx";

export function TrackMenu({ track }) {
  const [open, setOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const showToast = useToast();

  const playlists = useLibraryStore((state) => state.playlists);
  const isLiked = useLibraryStore((state) => state.isLiked(track.id));
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const addToPlaylist = useLibraryStore((state) => state.addToPlaylist);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setShowPlaylists(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLike() {
    toggleLike(track).then((liked) => {
      showToast?.(liked ? "Added to Liked Songs" : "Removed from Liked Songs");
    });
    setOpen(false);
  }

  function handleAddToQueue() {
    addToQueue(track);
    showToast?.("Added to Queue");
    setOpen(false);
  }

  function handleAddToPlaylist(playlist) {
    addToPlaylist(playlist.id, track);
    showToast?.(`Added to ${playlist.name}`);
    setOpen(false);
    setShowPlaylists(false);
  }

  function handleGoToArtist() {
    const slug = (track.artistName || "").toLowerCase().replace(/\s+/g, "-");
    navigate(`/artists/lastfm-${slug}`);
    setOpen(false);
  }

  return (
    <div className="track-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="icon-button icon-button--small"
        onClick={() => { setOpen(!open); setShowPlaylists(false); }}
        aria-label="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="track-menu">
          <button type="button" className="track-menu-item" onClick={handleAddToQueue}>
            <ListMusic size={16} />
            <span>Add to Queue</span>
          </button>

          <button
            type="button"
            className="track-menu-item"
            onClick={() => setShowPlaylists(!showPlaylists)}
          >
            <ListPlus size={16} />
            <span>Add to Playlist</span>
            <span className="track-menu-arrow">›</span>
          </button>

          {showPlaylists && (
            <div className="track-menu-sub">
              {playlists.length ? playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  className="track-menu-item"
                  onClick={() => handleAddToPlaylist(pl)}
                >
                  <span>{pl.name}</span>
                </button>
              )) : (
                <div className="track-menu-item muted">No playlists yet</div>
              )}
            </div>
          )}

          <button type="button" className="track-menu-item" onClick={handleLike}>
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            <span>{isLiked ? "Remove from Liked" : "Like"}</span>
          </button>

          <button type="button" className="track-menu-item" onClick={handleGoToArtist}>
            <User size={16} />
            <span>Go to Artist</span>
          </button>
        </div>
      )}
    </div>
  );
}
