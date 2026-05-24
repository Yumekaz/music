import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { RecentSearches, saveRecentSearch } from "../components/search/RecentSearches.jsx";
import { SearchResults } from "../components/search/SearchResults.jsx";
import { useSearch } from "../hooks/useSearch.js";
import { getCharts } from "../services/search.js";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";

const BROWSE_CATEGORIES = [
  { name: "Pop", gradient: "linear-gradient(135deg, #ec008c, #fc6767)", query: "Pop" },
  { name: "Hip Hop", gradient: "linear-gradient(135deg, #11998e, #38ef7d)", query: "Hip Hop" },
  { name: "Bollywood", gradient: "linear-gradient(135deg, #ff9900, #ff5b00)", query: "Bollywood" },
  { name: "Synthwave", gradient: "linear-gradient(135deg, #8a2387, #e94057, #f27121)", query: "Synthwave" },
  { name: "Indie", gradient: "linear-gradient(135deg, #00c6ff, #0072ff)", query: "Indie" },
  { name: "R&B", gradient: "linear-gradient(135deg, #f857a6, #ff5858)", query: "R&B" }
];

export default function Search() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // Force re-render when recent searches change
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  // Save query to recent searches when user actually searches something
  useEffect(() => {
    if (query.length >= 2) {
      const saveTimer = setTimeout(() => {
        saveRecentSearch(query);
        window.dispatchEvent(new Event("storage"));
      }, 1500);
      return () => clearTimeout(saveTimer);
    }
  }, [query]);

  const search = useSearch(query);
  const charts = useQuery({
    queryKey: ["charts"],
    queryFn: getCharts,
    enabled: !query
  });

  function handleSelectRecent(recentQuery) {
    setInput(recentQuery);
  }

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const searchHeadingClass = "grid gap-[16px] sticky top-0 bg-[#080b0a] pt-[16px] pb-[8px] z-20 shadow-[0_4px_24px_rgba(8,11,10,0.8)]";
  const searchLandingClass = "flex flex-col gap-[32px]";
  const sectionBlockClass = "grid gap-[16px]";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const browseGridClass = "grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[16px]";
  const browseCardClass = "relative aspect-[1.5] border-0 rounded-[12px] p-[16px] text-white text-[1.1rem] font-bold text-left cursor-pointer overflow-hidden transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-[4px] hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_50%)] before:z-[1] before:pointer-events-none";
  const trackListClass = "grid gap-[8px]";

  return (
    <div className={pageStackClass}>
      <section className={searchHeadingClass}>
        <h1 className="m-0 mb-[16px] text-[clamp(2.2rem,6vw,5.6rem)] leading-[0.96] tracking-normal font-bold">Search</h1>
        <SearchBar value={input} onChange={setInput} />
      </section>

      {!query ? (
        <div className={searchLandingClass}>
          <RecentSearches onSelect={handleSelectRecent} />

          <section className={sectionBlockClass}>
            <header className={sectionHeaderClass}>
              <h2 className="m-0 text-[1.2rem] font-bold">Browse All</h2>
            </header>
            <div className={browseGridClass}>
              {BROWSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className={browseCardClass}
                  style={{ background: cat.gradient }}
                  onClick={() => {
                    setInput(cat.query);
                    setQuery(cat.query);
                    saveRecentSearch(cat.query);
                    window.dispatchEvent(new Event("storage"));
                  }}
                >
                  <span className="relative z-[2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={sectionBlockClass}>
            <header className={sectionHeaderClass}>
              <h2 className="m-0 text-[1.2rem] font-bold">Global Charts</h2>
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
        </div>
      ) : (
        <SearchResults data={search.data} isLoading={search.isLoading} query={query} />
      )}
    </div>
  );
}
