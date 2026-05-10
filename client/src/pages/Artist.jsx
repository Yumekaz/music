import { useQuery } from "@tanstack/react-query";
import { Play, Shuffle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { useColorExtract } from "../hooks/useColorExtract.js";
import { getArtist } from "../services/artists.js";
import { usePlayerStore } from "../store/playerStore.js";

export default function Artist() {
  const { id } = useParams();
  const artist = useQuery({ queryKey: ["artist", id], queryFn: () => getArtist(id), enabled: Boolean(id) });
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const dominantColor = useColorExtract(artist.data?.imageUrl);

  if (artist.isLoading) return <LoadingSkeleton label="Loading artist" />;
  if (!artist.data) return <p className="empty-state">Artist not found.</p>;

  const { topTracks = [], similarArtists = [] } = artist.data;

  function playAll() {
    if (!topTracks.length) return;
    setQueue(topTracks);
    playTrack(topTracks[0], "youtube");
  }

  function shufflePlay() {
    if (!topTracks.length) return;
    const shuffled = [...topTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playTrack(shuffled[0], "youtube");
  }

  return (
    <div className="page-stack">
      <section
        className="artist-banner"
        style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.5) 0%, transparent 100%)` } : undefined}
      >
        <ImageWithFallback src={artist.data.imageUrl} alt={artist.data.name} className="artist-image" />
        <div>
          <p className="liked-label">Artist</p>
          <h1>{artist.data.name}</h1>
          {artist.data.bio && <p className="artist-bio">{artist.data.bio.slice(0, 200)}</p>}
          <div className="tag-row">
            {artist.data.tags?.map((tag) => (
              <span key={tag} className="provider-badge muted">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {topTracks.length > 0 && (
        <>
          <div className="liked-controls">
            <button type="button" className="play-button play-button--large" onClick={playAll} aria-label="Play all">
              <Play size={24} fill="currentColor" />
            </button>
            <button type="button" className="icon-button" onClick={shufflePlay} aria-label="Shuffle">
              <Shuffle size={20} />
            </button>
          </div>

          <section className="section-block">
            <header className="section-header">
              <h2>Popular</h2>
            </header>
            <div className="track-list">
              {topTracks.slice(0, 6).map((track) => (
                <TrackRow key={track.id} track={track} compact />
              ))}
            </div>
          </section>
        </>
      )}

      {similarArtists.length > 0 && (
        <section className="section-block">
          <header className="section-header">
            <h2>Fans also like</h2>
          </header>
          <div className="card-strip">
            {similarArtists.map((sa) => (
              <Link key={sa.id} to={`/artists/${sa.id}`} className="similar-artist-card">
                <ImageWithFallback src={sa.imageUrl} alt={sa.name} className="similar-artist-img" />
                <span className="similar-artist-name">{sa.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
