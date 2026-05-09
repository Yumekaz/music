import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { useMemo, useEffect } from "react";
import { TrackCard } from "../components/track/TrackCard.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { usePWAInstall } from "../hooks/usePWAInstall.js";
import { getCharts, getRecommendations } from "../services/search.js";
import { useLibraryStore } from "../store/libraryStore.js";

export default function Home() {
  const { canInstall, install } = usePWAInstall();
  const hydrate = useLibraryStore((state) => state.hydrate);
  const history = useLibraryStore((state) => state.history);
  const likedTracks = useLibraryStore((state) => state.likedTracks);

  useEffect(() => {
    hydrate().catch(() => {});
  }, [hydrate]);

  // Extract top seed artists from history + liked songs
  const seedArtists = useMemo(() => {
    const all = [...history, ...likedTracks];
    const counts = {};
    for (const track of all) {
      const name = track.artistName || track.artist;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    // Sort by frequency, pick top 5
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

  return (
    <div className="page-stack">
      <section className="home-hero">
        <div className="home-copy">
          <p>Music V3</p>
          <h1>
            {hasSeeds
              ? `Welcome back.`
              : `Search, play, preview, and keep your listening shelf offline.`}
          </h1>
          <div className="hero-actions">
            {canInstall ? (
              <button type="button" className="primary-action" onClick={install}>
                <Download size={18} aria-hidden="true" />
                <span>Install</span>
              </button>
            ) : null}
            {hasSeeds && (
              <button type="button" className="utility-button" onClick={() => recs.refetch()}>
                <RefreshCw size={16} aria-hidden="true" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Personalized "For You" sections */}
      {recs.isLoading && hasSeeds ? (
        <section className="section-block">
          <LoadingSkeleton label="Building your recommendations" />
        </section>
      ) : null}

      {recs.data?.sections?.map((section) => (
        <section key={section.seedArtist} className="section-block">
          <header className="section-header">
            <h2>{section.title}</h2>
            {section.similarArtists?.length > 0 && (
              <span className="section-subtitle">
                Also: {section.similarArtists.join(", ")}
              </span>
            )}
          </header>
          <div className="card-strip">
            {section.tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      ))}

      {/* Show "Recently played" if user has history */}
      {history.length > 0 && (
        <section className="section-block">
          <header className="section-header">
            <h2>Recently played</h2>
          </header>
          <div className="track-list">
            {history.slice(0, 5).map((track) => (
              <TrackRow key={track.id} track={track} compact />
            ))}
          </div>
        </section>
      )}

      {/* Charts as a fallback / always-present section */}
      <section className="section-block">
        <header className="section-header">
          <h2>{hasSeeds ? "Global Charts" : "Charts"}</h2>
        </header>
        {charts.isLoading ? (
          <LoadingSkeleton label="Loading charts" />
        ) : (
          <div className="track-list">
            {charts.data?.tracks?.slice(0, 6).map((track) => (
              <TrackRow key={track.id} track={track} compact />
            ))}
          </div>
        )}
      </section>

      {/* If no history yet, show empty state */}
      {!hasSeeds && (
        <section className="section-block">
          <p className="empty-state">
            Start listening! Your personalized feed will appear here once you play some songs.
          </p>
        </section>
      )}
    </div>
  );
}
