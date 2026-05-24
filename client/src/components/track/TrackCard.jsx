import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { usePlayerStore } from "../../store/playerStore.js";

export function TrackCard({ track }) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  function startPlayback(sourceType = "youtube") {
    playTrack(track, sourceType);
  }

  const trackCardClass = "relative grid gap-[12px] content-start min-w-0 overflow-hidden flex-[0_0_min(68vw,250px)] snap-start md:flex-none";
  const trackCardMediaClass = "relative min-w-0 aspect-square group";
  const trackCardArtLinkClass = "block w-full h-full border-0 p-0 bg-transparent cursor-pointer";
  const trackCardArtClass = "w-full h-full aspect-square rounded-[8px] object-cover bg-[#101510]";

  const playBtnClass = "absolute right-[12px] bottom-[12px] w-[40px] h-[40px] inline-grid place-items-center rounded-full bg-accent text-night border-0 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.42)] opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-95";

  const trackCardCopyClass = "grid gap-[4px] min-w-0";
  const trackTitleClass = "text-ink font-[800] border-0 p-0 bg-transparent text-left min-w-0 max-w-full cursor-pointer overflow-hidden line-clamp-2 min-h-[2.5em] hover:underline";
  const trackSubtitleClass = "block mt-[4px] text-[0.92rem] text-muted overflow-hidden whitespace-nowrap text-ellipsis hover:underline";

  return (
    <article className={trackCardClass}>
      <div className={trackCardMediaClass}>
        <button type="button" className={trackCardArtLinkClass} onClick={() => startPlayback("youtube")}>
          <ImageWithFallback src={track.artworkUrl} alt={track.title} className={trackCardArtClass} />
        </button>
        <button type="button" className={playBtnClass} onClick={() => startPlayback("youtube")} aria-label={`Play ${track.title}`}>
          <Play size={17} aria-hidden="true" className="ml-[2px]" />
        </button>
      </div>
      <div className={trackCardCopyClass}>
        <button type="button" className={trackTitleClass} onClick={() => startPlayback("youtube")}>
          {track.title}
        </button>
        {track.artistId ? (
          <Link to={`/artists/${track.artistId}`} className={trackSubtitleClass}>
            {track.artistName}
          </Link>
        ) : (
          <span className={trackSubtitleClass}>
            {track.artistName}
          </span>
        )}
      </div>
    </article>
  );
}
