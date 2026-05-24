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

  const trackRowClass = `grid items-center gap-[12px] md:gap-[14px] min-h-[64px] md:min-h-[72px] px-[8px] py-[6px] md:px-[10px] md:py-[8px] rounded-[8px] transition-colors duration-[160ms] hover:bg-[#101510] ${
    compact
      ? "grid-cols-[48px_minmax(0,1fr)_auto] md:grid-cols-[48px_minmax(0,1fr)_56px_auto]"
      : "grid-cols-[48px_minmax(0,1fr)_auto] md:grid-cols-[54px_minmax(0,1fr)_minmax(160px,auto)_56px_auto]"
  }`;

  const trackArtClass = "w-[48px] h-[48px] rounded-[6px] object-cover";
  const trackMainClass = "min-w-0 flex flex-col justify-center";
  const trackTitleRowClass = "flex items-center gap-[8px] min-w-0";
  const trackTitleClass = "block overflow-hidden whitespace-nowrap text-ellipsis text-ink font-[800] border-0 p-0 bg-transparent text-left cursor-pointer hover:underline min-w-0 max-w-full font-inherit";
  const downloadedIndicatorClass = "text-[#1ed760] flex-shrink-0";
  const trackSubtitleClass = "block overflow-hidden whitespace-nowrap text-ellipsis mt-[4px] text-[0.92rem] text-muted hover:underline min-w-0";

  const trackProvidersClass = "hidden md:flex flex-wrap gap-[8px]";
  const trackDurationClass = "hidden md:block text-muted text-[0.85rem] [font-variant-numeric:tabular-nums] text-right";
  const trackActionsClass = "flex items-center gap-[8px]";

  const iconBtnClass = "w-[38px] h-[38px] flex items-center justify-center border border-line rounded-full text-ink bg-night transition-all duration-150 hover:border-accent hover:text-accent active:scale-95 cursor-pointer";

  return (
    <article className={trackRowClass}>
      <ImageWithFallback src={track.artworkUrl} alt={track.title} className={trackArtClass} />
      <div className={trackMainClass}>
        <div className={trackTitleRowClass}>
          <button type="button" className={trackTitleClass} onClick={() => startPlayback("youtube")}>
            {track.title}
          </button>
          {isDownloaded && <Download size={13} className={downloadedIndicatorClass} title="Downloaded offline" />}
        </div>
        <Link to={`/artists/lastfm-${artistSlug}`} className={trackSubtitleClass}>
          {track.artistName} {track.albumName ? `- ${track.albumName}` : ""}
        </Link>
      </div>
      {!compact ? (
        <div className={trackProvidersClass}>
          {track.availableProviders?.slice(0, 3).map((provider) => (
            <ProviderBadge key={provider} provider={provider} href={track.externalLinks?.[provider]} />
          ))}
        </div>
      ) : <div className="hidden md:block"></div>}
      <span className={trackDurationClass}>{formatDuration(track.durationMs)}</span>
      <div className={trackActionsClass}>
        <button type="button" className={`${iconBtnClass} hidden md:flex`} onClick={() => startPlayback("youtube")} aria-label={`Play ${track.title}`}>
          <Play size={17} aria-hidden="true" className="ml-[2px]" />
        </button>
        <button type="button" className={`${iconBtnClass} ${isLiked ? "text-accent border-accent" : ""}`} onClick={() => toggleLike(track)} aria-label="Toggle like">
          <Heart size={17} aria-hidden="true" fill={isLiked ? "currentColor" : "none"} />
        </button>
        <TrackMenu track={track} />
      </div>
    </article>
  );
}
