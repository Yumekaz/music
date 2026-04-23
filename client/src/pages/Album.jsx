import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { getAlbum } from "../services/albums.js";

export default function Album() {
  const { id } = useParams();
  const album = useQuery({ queryKey: ["album", id], queryFn: () => getAlbum(id), enabled: Boolean(id) });

  if (album.isLoading) return <LoadingSkeleton label="Loading album" />;
  if (!album.data) return <p className="empty-state">Album not found.</p>;

  return (
    <div className="page-stack">
      <section className="album-header">
        <ImageWithFallback src={album.data.artworkUrl} alt={album.data.title} className="album-art-large" />
        <div>
          <p>Album</p>
          <h1>{album.data.title}</h1>
          <h2>{album.data.artistName}</h2>
          <span>{album.data.releaseDate}</span>
        </div>
      </section>
      <section className="section-block">
        <header className="section-header">
          <h2>Tracks</h2>
        </header>
        <div className="track-list">
          {album.data.tracks?.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      </section>
    </div>
  );
}
