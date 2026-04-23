import { useEffect } from "react";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { useLibraryStore } from "../store/libraryStore.js";

export default function Library() {
  const { likedTracks, history, playlists, hydrate, hydrated, savePlaylist } = useLibraryStore();

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  function createPlaylist() {
    savePlaylist({
      id: `playlist-${Date.now()}`,
      name: "New playlist",
      tracks: [],
      createdAt: Date.now()
    });
  }

  return (
    <div className="page-stack">
      <section className="section-block">
        <header className="section-header">
          <h1>Library</h1>
          <span>{hydrated ? "Ready offline" : "Syncing"}</span>
        </header>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Liked tracks</h2>
          <span>{likedTracks.length}</span>
        </header>
        <div className="track-list">
          {likedTracks.map((track) => (
            <TrackRow key={track.id} track={track} compact />
          ))}
        </div>
        {!likedTracks.length ? <p className="empty-state">Liked tracks will stay available offline.</p> : null}
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Playlists</h2>
          <button type="button" className="utility-button" onClick={createPlaylist}>
            New
          </button>
        </header>
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <a href={`/playlists/${playlist.id}`} key={playlist.id} className="playlist-tile">
              <strong>{playlist.name}</strong>
              <span>{playlist.tracks?.length || 0} tracks</span>
            </a>
          ))}
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>History</h2>
        </header>
        <div className="track-list">
          {history.slice(0, 8).map((track) => (
            <TrackRow key={track.id} track={track} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
