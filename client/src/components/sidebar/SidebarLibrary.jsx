import { Heart, ListMusic, Plus, Search, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function SidebarLibrary() {
  const { likedTracks, playlists, hydrated, hydrate, savePlaylist } = useLibraryStore();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  function createPlaylist() {
    savePlaylist({
      id: `playlist-${Date.now()}`,
      name: `My Playlist #${playlists.length + 1}`,
      tracks: [],
      createdAt: Date.now()
    });
  }

  // Check if current track is in liked songs
  const isPlayingLiked = currentTrack && isPlaying && likedTracks.some((t) => t.id === currentTrack.id);

  // Filter items
  const showLiked = filter === "all" || filter === "liked";
  const showPlaylists = filter === "all" || filter === "playlists";

  const filteredPlaylists = playlists.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar-library">
      <header className="lib-header">
        <button type="button" className="lib-header-title" onClick={() => setFilter("all")}>
          <ListMusic size={18} aria-hidden="true" />
          <span>Your Library</span>
        </button>
        <div className="lib-header-actions">
          <button type="button" className="lib-icon-btn" onClick={createPlaylist} aria-label="Create playlist">
            <Plus size={18} />
          </button>
        </div>
      </header>

      <div className="lib-filters">
        <button
          type="button"
          className={`lib-chip ${filter === "playlists" ? "active" : ""}`}
          onClick={() => setFilter(filter === "playlists" ? "all" : "playlists")}
        >
          Playlists
        </button>
        <button
          type="button"
          className={`lib-chip ${filter === "liked" ? "active" : ""}`}
          onClick={() => setFilter(filter === "liked" ? "all" : "liked")}
        >
          Liked
        </button>
      </div>

      <div className="lib-search-row">
        <button
          type="button"
          className="lib-icon-btn lib-search-toggle"
          onClick={() => setSearch(search ? "" : " ")}
          aria-label="Search in library"
        >
          <Search size={16} />
        </button>
        {search !== "" && (
          <input
            className="lib-search-input"
            type="text"
            placeholder="Search in Your Library"
            value={search.trim()}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        )}
        <span className="lib-sort">Recents</span>
      </div>

      <div className="lib-items">
        {showLiked && (
          <NavLink to="/library" className={({ isActive }) => `lib-item ${isActive ? "active" : ""}`}>
            <div className="lib-liked-icon">
              <Heart size={16} fill="white" />
            </div>
            <div className="lib-item-info">
              <span className="lib-item-title">Liked Songs</span>
              <span className="lib-item-meta">
                <span className="lib-pin">📌</span> Playlist • {likedTracks.length} song{likedTracks.length !== 1 ? "s" : ""}
              </span>
            </div>
            {isPlayingLiked && (
              <Volume2 size={16} className="lib-playing-icon" />
            )}
          </NavLink>
        )}

        {showPlaylists && filteredPlaylists.map((playlist) => {
          const isPlayingHere = currentTrack && isPlaying && playlist.tracks?.some((t) => t.id === currentTrack.id);
          const artworks = (playlist.tracks || []).slice(0, 4).map((t) => t.artworkUrl).filter(Boolean);

          return (
            <NavLink
              key={playlist.id}
              to={`/playlists/${playlist.id}`}
              className={({ isActive }) => `lib-item ${isActive ? "active" : ""}`}
            >
              <div className="lib-playlist-art">
                {artworks.length >= 4 ? (
                  <div className="lib-mosaic">
                    {artworks.slice(0, 4).map((url, i) => (
                      <img key={i} src={url} alt="" />
                    ))}
                  </div>
                ) : artworks.length > 0 ? (
                  <img src={artworks[0]} alt="" className="lib-single-art" />
                ) : (
                  <div className="lib-empty-art">
                    <ListMusic size={20} />
                  </div>
                )}
              </div>
              <div className="lib-item-info">
                <span className={`lib-item-title ${isPlayingHere ? "playing" : ""}`}>
                  {playlist.name}
                </span>
                <span className="lib-item-meta">
                  Playlist • {playlist.tracks?.length || 0} song{(playlist.tracks?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
              {isPlayingHere && (
                <Volume2 size={16} className="lib-playing-icon" />
              )}
            </NavLink>
          );
        })}

        {!hydrated && (
          <div className="lib-item">
            <div className="lib-empty-art"><ListMusic size={20} /></div>
            <div className="lib-item-info">
              <span className="lib-item-title">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
