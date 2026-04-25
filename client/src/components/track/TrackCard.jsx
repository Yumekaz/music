import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { playDirectAudio } from "../../lib/directAudio.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function TrackCard({ track }) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  function startPlayback(sourceType = "youtube") {
    if (sourceType === "preview") {
      playDirectAudio(track, sourceType).catch(() => {});
    }
    playTrack(track, sourceType);
  }

  return (
    <article className="track-card">
      <div className="track-card-media">
        <Link to={`/tracks/${track.id}`} className="track-card-art-link">
          <ImageWithFallback src={track.artworkUrl} alt={track.title} className="track-card-art" />
        </Link>
        <button type="button" className="play-button small" onClick={() => startPlayback("youtube")} aria-label={`Play ${track.title}`}>
          <Play size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="track-card-copy">
        <Link to={`/tracks/${track.id}`} className="track-title">
          {track.title}
        </Link>
        <Link to={`/artists/${track.artistId}`} className="track-subtitle">
          {track.artistName}
        </Link>
      </div>
    </article>
  );
}
