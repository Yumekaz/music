import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { usePlayerStore } from "../../store/playerStore.js";

export function TrackCard({ track }) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  function startPlayback(sourceType = "youtube") {
    playTrack(track, sourceType);
  }

  return (
    <article className="track-card spotify-track-card">
      <div className="track-card-media">
        <button type="button" className="track-card-art-link" onClick={() => startPlayback("youtube")}>
          <ImageWithFallback src={track.artworkUrl} alt={track.title} className="track-card-art" />
        </button>
      </div>
      <div className="track-card-copy">
        <button type="button" className="track-title" onClick={() => startPlayback("youtube")}>
          {track.title}
        </button>
        {track.artistId ? (
          <Link to={`/artists/${track.artistId}`} className="track-subtitle">
            {track.artistName}
          </Link>
        ) : (
          <span className="track-subtitle">
            {track.artistName}
          </span>
        )}
      </div>
    </article>
  );
}
