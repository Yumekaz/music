import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { TrackCard } from "../components/track/TrackCard.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { usePWAInstall } from "../hooks/usePWAInstall.js";
import { getCharts, getTrending } from "../services/search.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { useEffect } from "react";

export default function Home() {
  const { canInstall, install } = usePWAInstall();
  const hydrate = useLibraryStore((state) => state.hydrate);
  const history = useLibraryStore((state) => state.history);
  const trending = useQuery({ queryKey: ["trending"], queryFn: getTrending });
  const charts = useQuery({ queryKey: ["charts"], queryFn: getCharts });

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  return (
    <div className="page-stack">
      <section className="home-hero">
        <div className="home-copy">
          <p>Music V3</p>
          <h1>Search, play, preview, and keep your listening shelf offline.</h1>
          <div className="hero-actions">
            {canInstall ? (
              <button type="button" className="primary-action" onClick={install}>
                <Download size={18} aria-hidden="true" />
                <span>Install</span>
              </button>
            ) : null}
            <button type="button" className="utility-button" onClick={() => trending.refetch()}>
              <RefreshCw size={16} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </section>

      <section className="section-block">
        <header className="section-header">
          <h2>Trending</h2>
          <span>Region IN</span>
        </header>
        {trending.isLoading ? (
          <LoadingSkeleton label="Loading trending tracks" />
        ) : (
          <div className="card-strip">
            {trending.data?.tracks?.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <header className="section-header">
          <h2>Charts</h2>
          <span>Last.fm or fallback</span>
        </header>
        <div className="track-list">
          {charts.data?.tracks?.slice(0, 6).map((track) => (
            <TrackRow key={track.id} track={track} compact />
          ))}
        </div>
      </section>

      <section className="section-block">
        <header className="section-header">
          <h2>Recently played</h2>
          <span>IndexedDB</span>
        </header>
        {history.length ? (
          <div className="track-list">
            {history.slice(0, 5).map((track) => (
              <TrackRow key={track.id} track={track} compact />
            ))}
          </div>
        ) : (
          <p className="empty-state">Played tracks will appear here.</p>
        )}
      </section>
    </div>
  );
}
