import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { AlbumCard } from "../components/album/AlbumCard.jsx";
import { getArtist } from "../services/artists.js";

export default function Artist() {
  const { id } = useParams();
  const artist = useQuery({ queryKey: ["artist", id], queryFn: () => getArtist(id), enabled: Boolean(id) });

  if (artist.isLoading) return <LoadingSkeleton label="Loading artist" />;
  if (!artist.data) return <p className="empty-state">Artist not found.</p>;

  return (
    <div className="page-stack">
      <section className="artist-banner">
        <ImageWithFallback src={artist.data.imageUrl} alt={artist.data.name} className="artist-image" />
        <div>
          <p>Artist</p>
          <h1>{artist.data.name}</h1>
          <p>{artist.data.bio}</p>
          <div className="tag-row">
            {artist.data.tags?.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Top tracks</h2>
        </header>
        <div className="track-list">
          {artist.data.topTracks?.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Albums</h2>
        </header>
        <div className="entity-grid">
          {artist.data.albums?.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>
    </div>
  );
}
