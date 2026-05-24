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
  if (!artist.data) return <p className="text-muted m-0 p-[24px]">Artist not found.</p>;

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

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const artistBannerClass = "grid grid-cols-1 md:grid-cols-[minmax(220px,340px)_minmax(0,1fr)] gap-[28px] items-center pb-[16px] md:pb-[24px] border-b border-line p-[16px] md:p-0";
  const artistImageClass = "w-full aspect-square rounded-[8px] object-cover bg-[#101510]";
  const headerInfoClass = "min-w-0";
  const headerLabelClass = "uppercase text-[0.78rem] font-bold text-ink m-0 mb-[8px]";
  const headerTitleClass = "text-[clamp(2.5rem,7vw,5.8rem)] leading-[1.1] font-bold m-0 text-ink";
  const artistBioClass = "max-w-[760px] text-[#c8d0c6] leading-[1.65] mt-[8px]";
  const tagRowClass = "flex flex-wrap gap-[8px] mt-[16px]";
  const providerBadgeMutedClass = "min-h-[28px] px-[10px] py-[5px] border border-line rounded-full text-muted bg-panel text-[0.78rem]";

  const controlsRowClass = "flex items-center justify-center md:justify-start gap-[16px] py-[16px] md:py-[24px]";
  const playBtnClass = "w-[56px] h-[56px] inline-grid place-items-center rounded-full bg-accent text-night border-0 cursor-pointer shadow-[0_8px_24px_rgba(30,215,96,0.2)] transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-95";
  const iconBtnClass = "w-[38px] h-[38px] flex items-center justify-center border border-line rounded-full text-ink bg-night transition-all duration-150 hover:border-accent hover:text-accent active:scale-95 cursor-pointer";

  const sectionBlockClass = "grid gap-[16px] px-[16px] md:px-0";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const trackListClass = "grid gap-[4px]";
  const cardStripClass = "flex gap-[18px] overflow-x-auto overflow-y-hidden -mx-[16px] px-[16px] pb-[12px] snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-[repeat(2,1fr)] lg:grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] md:gap-[16px] md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none";

  const similarArtistCardClass = "flex flex-[0_0_min(58vw,180px)] md:flex-none snap-start flex-col items-center gap-[12px] p-[16px] bg-[#141914] rounded-[8px] transition-colors duration-200 hover:bg-[#1c221c]";
  const similarArtistImgClass = "w-[120px] h-[120px] rounded-full object-cover bg-panel";
  const similarArtistNameClass = "text-[0.85rem] font-medium text-center text-ink";

  return (
    <div className={pageStackClass}>
      <section
        className={artistBannerClass}
        style={dominantColor ? { background: `linear-gradient(180deg, rgba(${dominantColor}, 0.5) 0%, transparent 100%)` } : undefined}
      >
        <ImageWithFallback src={artist.data.imageUrl} alt={artist.data.name} className={artistImageClass} />
        <div className={headerInfoClass}>
          <p className={headerLabelClass}>Artist</p>
          <h1 className={headerTitleClass}>{artist.data.name}</h1>
          {artist.data.bio && <p className={artistBioClass}>{artist.data.bio.slice(0, 200)}</p>}
          <div className={tagRowClass}>
            {artist.data.tags?.map((tag) => (
              <span key={tag} className={providerBadgeMutedClass}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {topTracks.length > 0 && (
        <>
          <div className={controlsRowClass}>
            <button type="button" className={playBtnClass} onClick={playAll} aria-label="Play all">
              <Play size={24} fill="currentColor" className="ml-[3px]" />
            </button>
            <button type="button" className={iconBtnClass} onClick={shufflePlay} aria-label="Shuffle">
              <Shuffle size={20} />
            </button>
          </div>

          <section className={sectionBlockClass}>
            <header className={sectionHeaderClass}>
              <h2 className="m-0 text-[1.2rem] font-bold text-ink">Popular</h2>
            </header>
            <div className={trackListClass}>
              {topTracks.slice(0, 6).map((track) => (
                <TrackRow key={track.id} track={track} compact />
              ))}
            </div>
          </section>
        </>
      )}

      {similarArtists.length > 0 && (
        <section className={sectionBlockClass}>
          <header className={sectionHeaderClass}>
            <h2 className="m-0 text-[1.2rem] font-bold text-ink">Fans also like</h2>
          </header>
          <div className={cardStripClass}>
            {similarArtists.map((sa) => (
              <Link key={sa.id} to={`/artists/${sa.id}`} className={similarArtistCardClass}>
                <ImageWithFallback src={sa.imageUrl} alt={sa.name} className={similarArtistImgClass} />
                <span className={similarArtistNameClass}>{sa.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
