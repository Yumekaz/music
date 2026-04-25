import { Heart, ListPlus, Play, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { ProviderBadge } from "../common/ProviderBadge.jsx";
import { playDirectAudio } from "../../lib/directAudio.js";
import { formatDuration } from "../../lib/formatters.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function TrackRow({ track, compact = false }) {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const isLiked = useLibraryStore((state) => state.isLiked(track.id));
  const toggleLike = useLibraryStore((state) => state.toggleLike);

  function startPlayback(sourceType = "youtube") {
    if (sourceType === "preview" || sourceType === "jamendo") {
      playDirectAudio(track, sourceType).catch(() => {});
    }
    playTrack(track, sourceType);
  }

  return (
    <article className={`track-row ${compact ? "compact" : ""}`}>
      <ImageWithFallback src={track.artworkUrl} alt={track.title} className="track-art" />
      <div className="track-main">
        <button type="button" className="track-title" onClick={() => startPlayback("youtube")}>
          {track.title}
        </button>
        {track.artistId ? (
          <Link to={`/artists/${track.artistId}`} className="track-subtitle">
            {track.artistName} {track.albumName ? `- ${track.albumName}` : ""}
          </Link>
        ) : (
          <span className="track-subtitle">
            {track.artistName} {track.albumName ? `- ${track.albumName}` : ""}
          </span>
        )}
      </div>
      {!compact ? (
        <div className="track-providers">
          {track.availableProviders?.slice(0, 3).map((provider) => (
            <ProviderBadge key={provider} provider={provider} href={track.externalLinks?.[provider]} />
          ))}
        </div>
      ) : null}
      <span className="track-duration">{formatDuration(track.durationMs)}</span>
      <div className="track-actions">
        <button type="button" className="icon-button" onClick={() => startPlayback("youtube")} aria-label={`Play ${track.title}`}>
          <Play size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => track.previewUrl && startPlayback("preview")}
          disabled={!track.previewUrl}
          aria-label={`Preview ${track.title}`}
        >
          <Radio size={17} aria-hidden="true" />
        </button>
        <button type="button" className={`icon-button ${isLiked ? "liked" : ""}`} onClick={() => toggleLike(track)} aria-label="Toggle like">
          <Heart size={17} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" onClick={() => setQueue([track])} aria-label="Start queue here">
          <ListPlus size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
