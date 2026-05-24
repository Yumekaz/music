import { Heart, Play, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { ProviderBadge } from "../common/ProviderBadge.jsx";
import { TrackMenu } from "./TrackMenu.jsx";
import { formatDuration } from "../../lib/formatters.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { usePlayerStore } from "../../store/playerStore.js";

export function TrackRow({ track, compact = false }) {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const isLiked = useLibraryStore((state) => state.isLiked(track.id));
  const isDownloaded = useLibraryStore((state) => state.isDownloaded(track.id));
  const toggleLike = useLibraryStore((state) => state.toggleLike);

  function startPlayback(sourceType = "youtube") {
    playTrack(track, sourceType);
  }

  const artistSlug = (track.artistName || "").toLowerCase().replace(/\s+/g, "-");

  return (
    <article className={`track-row spotify-track-row ${compact ? "compact" : ""}`}>
      <ImageWithFallback src={track.artworkUrl} alt={track.title} className="track-art" />
      <div className="track-main">
        <div className="track-title-row">
          <button type="button" className="track-title" onClick={() => startPlayback("youtube")}>
            {track.title}
          </button>
          {isDownloaded && <Download size={13} className="downloaded-indicator" title="Downloaded offline" />}
        </div>
        <Link to={`/artists/lastfm-${artistSlug}`} className="track-subtitle">
          {track.artistName} {track.albumName ? `- ${track.albumName}` : ""}
        </Link>
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
        <button type="button" className={`icon-button ${isLiked ? "liked" : ""}`} onClick={() => toggleLike(track)} aria-label="Toggle like">
          <Heart size={17} aria-hidden="true" />
        </button>
        <TrackMenu track={track} />
      </div>
    </article>
  );
}
