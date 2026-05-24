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

  return (
    <div className="page-stack">
      <section className="search-heading">
        <h1>Search</h1>
        <SearchBar value={input} onChange={setInput} />
      </section>
      
      {!query ? (
        <div className="search-landing-container">
          <RecentSearches onSelect={handleSelectRecent} />
          
          <section className="section-block">
            <header className="section-header">
              <h2>Browse All</h2>
            </header>
            <div className="browse-grid">
              {BROWSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className="browse-card"
                  style={{ background: cat.gradient }}
                  onClick={() => {
                    setInput(cat.query);
                    setQuery(cat.query);
                    saveRecentSearch(cat.query);
                    window.dispatchEvent(new Event("storage"));
                  }}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="section-block">
            <header className="section-header">
              <h2>Global Charts</h2>
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
        </div>
      ) : (
        <SearchResults data={search.data} isLoading={search.isLoading} query={query} />
      )}
    </div>
  );
}
