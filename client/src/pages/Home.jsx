import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useEffect } from "react";
import { TrackCard } from "../components/track/TrackCard.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { getCharts, getRecommendations } from "../services/search.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";

export default function Home() {
  const hydrate = useLibraryStore((state) => state.hydrate);
  const history = useLibraryStore((state) => state.history);
  const likedTracks = useLibraryStore((state) => state.likedTracks);
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  const seedArtists = useMemo(() => {
    const all = [...history, ...likedTracks];
    const counts = {};
    for (const track of all) {
      const name = track.artistName || track.artist;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 5);
  }, [history, likedTracks]);

  const hasSeeds = seedArtists.length > 0;

  const recs = useQuery({
    queryKey: ["recommendations", seedArtists],
    queryFn: () => getRecommendations(seedArtists),
    enabled: hasSeeds,
    staleTime: 30 * 60 * 1000 // 30 min
  });

  const charts = useQuery({ queryKey: ["charts"], queryFn: getCharts });
  const showQuickGrid = history.length >= 2;

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const homeHeroClass = "min-h-[320px] flex items-end p-[34px] border border-line rounded-[8px] overflow-hidden bg-[linear-gradient(90deg,rgba(8,11,10,0.92),rgba(8,11,10,0.58)),url('/assets/music-v3-hero.png')] bg-center bg-cover";
  const homeCopyClass = "max-w-[740px]";
  const accentTextClass = "text-[#1ed760] m-0 mb-[10px] uppercase tracking-normal text-[0.78rem] font-[800]";
  const h1Class = "m-0 mb-[16px] text-[clamp(2.2rem,6vw,5.6rem)] leading-[0.96] tracking-normal font-bold";
  const heroActionsClass = "flex flex-wrap gap-[12px]";
  const utilityBtnClass = "inline-flex items-center gap-[10px] min-h-[42px] px-[16px] border border-line rounded-full bg-night text-ink font-[800] cursor-pointer transition-colors duration-[160ms] hover:border-[#1ed760] hover:text-[#1ed760]";
  const quickGridClass = "grid grid-cols-2 md:grid-cols-4 gap-[8px] md:gap-[12px]";
  const quickCardClass = "flex items-center gap-[16px] h-[56px] pr-[16px] border-0 rounded-[4px] bg-[rgba(255,255,255,0.06)] overflow-hidden text-ink text-[0.9rem] font-bold cursor-pointer transition-all duration-[240ms] hover:bg-[rgba(255,255,255,0.12)] hover:scale-[1.02] active:scale-[0.98]";
  const sectionBlockClass = "grid gap-[16px]";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const sectionSubtitleClass = "text-muted text-[0.82rem] font-normal";
  const cardStripClass = "flex gap-[18px] overflow-x-auto overflow-y-hidden -mx-[16px] px-[16px] pb-[12px] snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] md:gap-[16px] md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none";
  const trackListClass = "grid gap-[8px]";

  return (
    <div className={pageStackClass}>
      {!showQuickGrid && (
        <section className={homeHeroClass}>
          <div className={homeCopyClass}>
            <p className={accentTextClass}>Reverb</p>
            <h1 className={h1Class}>{hasSeeds ? "Welcome back." : "Music that echoes your taste."}</h1>
            {hasSeeds && (
              <div className={heroActionsClass}>
                <button type="button" className={utilityBtnClass} onClick={() => recs.refetch()}>
                  <RefreshCw size={16} aria-hidden="true" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {showQuickGrid && (
        <section className={quickGridClass} aria-label="Recently played">
          {history.slice(0, 8).map((track) => (
            <button
              key={`quick-${track.id}`}
              type="button"
              className={quickCardClass}
              onClick={() => playTrack(track, "youtube")}
              aria-label={`Play ${track.title}`}
            >
              <img src={track.artworkUrl} alt={track.title} className="w-[56px] h-[56px] object-cover bg-panel shadow-[4px_0_12px_rgba(0,0,0,0.2)]" />
              <span className="truncate">{track.title}</span>
            </button>
          ))}
        </section>
      )}

      {recs.isLoading && hasSeeds ? (
        <section className={sectionBlockClass}>
          <LoadingSkeleton label="Building your recommendations" />
        </section>
      ) : null}

      {recs.data?.sections?.map((section) => (
        <section key={section.seedArtist} className={sectionBlockClass}>
          <header className={sectionHeaderClass}>
            <h2 className="m-0 text-[1.2rem] font-bold">{section.title}</h2>
            {section.similarArtists?.length > 0 && (
              <span className={sectionSubtitleClass}>
                Also: {section.similarArtists.join(", ")}
              </span>
            )}
          </header>
          <div className={cardStripClass}>
            {section.tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      ))}

      <section className={sectionBlockClass}>
        <header className={sectionHeaderClass}>
          <h2 className="m-0 text-[1.2rem] font-bold">{hasSeeds ? "Global Charts" : "Charts"}</h2>
        </header>
        {charts.isLoading ? (
          <LoadingSkeleton label="Loading charts" />
        ) : (
          <div className={trackListClass}>
            {charts.data?.tracks?.slice(0, 6).map((track) => (
              <TrackRow key={track.id} track={track} compact />
            ))}
          </div>
        )}
      </section>

      {!hasSeeds && (
        <section className={sectionBlockClass}>
          <p className="text-muted m-0">
            Start listening! Your personalized feed will appear here once you play some songs.
          </p>
        </section>
      )}
    </div>
  );
}
