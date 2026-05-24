import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useEffect } from "react";
import { TrackCard } from "../components/track/TrackCard.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { getCharts, getRecommendations } from "../services/search.js";
import { useLibraryStore } from "../store/libraryStore.js";

export default function Home() {
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
  const showQuickGrid = history.length >= 2;

  return (
    <div className="page-stack">
      {!showQuickGrid && (
        <section className="home-hero">
          <div className="home-copy">
            <p>Reverb</p>
            <h1>{hasSeeds ? "Welcome back." : "Music that echoes your taste."}</h1>
            {hasSeeds && (
              <div className="hero-actions">
                <button type="button" className="utility-button" onClick={() => recs.refetch()}>
                  <RefreshCw size={16} aria-hidden="true" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {showQuickGrid && (
        <section className="spotify-quick-grid">
          {history.slice(0, 8).map((track) => (
            <div key={`quick-${track.id}`} className="spotify-quick-card">
              <img src={track.artworkUrl} alt={track.title} />
              <span>{track.title}</span>
            </div>
          ))}
        </section>
      )}

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
