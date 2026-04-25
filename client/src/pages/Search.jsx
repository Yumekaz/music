import { useEffect, useState } from "react";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { RecentSearches, saveRecentSearch } from "../components/search/RecentSearches.jsx";
import { SearchResults } from "../components/search/SearchResults.jsx";
import { useSearch } from "../hooks/useSearch.js";

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

  function handleSelectRecent(recentQuery) {
    setInput(recentQuery);
  }

  return (
    <div className="page-stack">
      <section className="search-heading">
        <h1>Search</h1>
        <SearchBar value={input} onChange={setInput} />
      </section>
      {!query && <RecentSearches onSelect={handleSelectRecent} />}
      <SearchResults data={search.data} isLoading={search.isLoading} query={query} />
    </div>
  );
}
