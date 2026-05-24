import { Heart, ListMusic, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { PlayingBars } from "../common/PlayingBars.jsx";

export function SidebarLibrary() {
  const { likedTracks, playlists, hydrated, hydrate, savePlaylist } = useLibraryStore();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
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
    <div className="flex-1 flex flex-col min-h-0 px-[8px] pb-[8px]">
      <header className="flex items-center justify-between pt-[12px] px-[8px] pb-[8px]">
        <button type="button" className="inline-flex items-center gap-[8px] border-0 p-0 bg-transparent text-muted font-bold text-[0.92rem] cursor-pointer transition-colors duration-[160ms] hover:text-ink" onClick={() => setFilter("all")}>
          <ListMusic size={18} aria-hidden="true" />
          <span>Your Library</span>
        </button>
        <div className="flex gap-[4px]">
          <button type="button" className="w-[32px] h-[32px] inline-grid place-items-center border-0 rounded-full text-muted bg-transparent cursor-pointer transition-colors duration-[160ms] hover:text-ink hover:bg-[rgba(255,255,255,0.07)]" onClick={createPlaylist} aria-label="Create playlist">
            <Plus size={18} />
          </button>
        </div>
      </header>

      <div className="flex gap-[8px] pt-[4px] px-[8px] pb-[8px]">
        <button
          type="button"
          className={`min-h-[28px] px-[12px] border-0 rounded-full text-[0.78rem] font-semibold cursor-pointer transition-colors duration-[160ms] ${filter === "playlists" ? "bg-ink text-night" : "text-ink bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)]"}`}
          onClick={() => setFilter(filter === "playlists" ? "all" : "playlists")}
        >
          Playlists
        </button>
        <button
          type="button"
          className={`min-h-[28px] px-[12px] border-0 rounded-full text-[0.78rem] font-semibold cursor-pointer transition-colors duration-[160ms] ${filter === "liked" ? "bg-ink text-night" : "text-ink bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)]"}`}
          onClick={() => setFilter(filter === "liked" ? "all" : "liked")}
        >
          Liked
        </button>
      </div>

      <div className="flex items-center gap-[6px] pt-[2px] px-[8px] pb-[6px]">
        <button
          type="button"
          className="w-[32px] h-[32px] inline-grid place-items-center border-0 rounded-full text-muted bg-transparent cursor-pointer transition-colors duration-[160ms] hover:text-ink hover:bg-[rgba(255,255,255,0.07)]"
          onClick={() => setSearch(search ? "" : " ")}
          aria-label="Search in library"
        >
          <Search size={16} />
        </button>
        {search !== "" && (
          <input
            className="flex-1 min-w-0 h-[28px] px-[8px] border-0 rounded-[4px] bg-[rgba(255,255,255,0.08)] text-ink text-[0.8rem] outline-none"
            type="text"
            placeholder="Search in Your Library"
            value={search.trim()}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        )}
        <span className="ml-auto text-muted text-[0.78rem] whitespace-nowrap">Recents</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-[2px] lib-items">
        {showLiked && (
          <NavLink to="/library" className={({ isActive }) => `flex items-center gap-[10px] p-[8px] rounded-[6px] transition-colors duration-[160ms] cursor-pointer hover:bg-[rgba(255,255,255,0.07)] ${isActive ? "bg-[rgba(255,255,255,0.07)]" : ""}`}>
            <div className="w-[48px] h-[48px] min-w-[48px] grid place-items-center rounded-[4px] bg-gradient-to-br from-[#450af5] to-[#c4efd9]">
              <Heart size={16} fill="white" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
              <span className="font-semibold text-[0.9rem] truncate">Liked Songs</span>
              <span className="text-muted text-[0.78rem] truncate">
                <span className="text-[0.7rem]">📌</span> Playlist • {likedTracks.length} song{likedTracks.length !== 1 ? "s" : ""}
              </span>
            </div>
            {isPlayingLiked && (
              <PlayingBars isPlaying={isPlaying} isBuffering={isBuffering} />
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
              className={({ isActive }) => `flex items-center gap-[10px] p-[8px] rounded-[6px] transition-colors duration-[160ms] cursor-pointer hover:bg-[rgba(255,255,255,0.07)] ${isActive ? "bg-[rgba(255,255,255,0.07)]" : ""}`}
            >
              <div className="w-[48px] h-[48px] min-w-[48px] rounded-[4px] overflow-hidden bg-[#181e18]">
                {artworks.length >= 4 ? (
                  <div className="grid grid-cols-2 w-full h-full">
                    {artworks.slice(0, 4).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                ) : artworks.length > 0 ? (
                  <img src={artworks[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-[48px] h-[48px] min-w-[48px] grid place-items-center rounded-[4px] bg-[#181e18] text-muted">
                    <ListMusic size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                <span className={`font-semibold text-[0.9rem] truncate ${isPlayingHere ? "text-accent" : ""}`}>
                  {playlist.name}
                </span>
                <span className="text-muted text-[0.78rem] truncate">
                  Playlist • {playlist.tracks?.length || 0} song{(playlist.tracks?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
              {isPlayingHere && (
                <PlayingBars isPlaying={isPlaying} isBuffering={isBuffering} />
              )}
            </NavLink>
          );
        })}

        {!hydrated && (
          <div className="flex items-center gap-[10px] p-[8px] rounded-[6px] transition-colors duration-[160ms]">
            <div className="w-[48px] h-[48px] min-w-[48px] grid place-items-center rounded-[4px] bg-[#181e18] text-muted"><ListMusic size={20} /></div>
            <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
              <span className="font-semibold text-[0.9rem] truncate">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
