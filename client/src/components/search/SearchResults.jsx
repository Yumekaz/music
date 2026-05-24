import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../common/LoadingSkeleton.jsx";
import { TrackRow } from "../track/TrackRow.jsx";

export function SearchResults({ data, isLoading, query }) {
  if (isLoading) return <LoadingSkeleton label="Searching" />;

  if (!query) {
    return <p className="empty-state">Search any song, artist, or album.</p>;
  }

  if (!data?.tracks?.length && !data?.artists?.length && !data?.albums?.length) {
    return <p className="empty-state">No matches yet.</p>;
  }

  return (
    <div className="results-stack">
      <section className="section-block">
        <header className="section-header">
          <h2>Tracks</h2>
        </header>
        <div className="track-list">
          {data.tracks?.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Artists</h2>
        </header>
        <div className="entity-grid">
          {data.artists?.map((artist) => (
            <Link to={`/artists/${artist.id}`} key={artist.id} className="entity-tile">
              <ImageWithFallback src={artist.imageUrl} alt={artist.name} className="entity-image" />
              <span>{artist.name}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Albums</h2>
        </header>
        <div className="entity-grid">
          {data.albums?.map((album) => (
            <Link to={`/albums/${album.id}`} key={album.id} className="entity-tile">
              <ImageWithFallback src={album.artworkUrl} alt={album.title} className="entity-image" />
              <span>{album.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
