import { useEffect, useState } from "react";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { SearchResults } from "../components/search/SearchResults.jsx";
import { useSearch } from "../hooks/useSearch.js";

export default function Search() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const search = useSearch(query);

  return (
    <div className="page-stack">
      <section className="search-heading">
        <h1>Search</h1>
        <SearchBar value={input} onChange={setInput} />
      </section>
      <SearchResults data={search.data} isLoading={search.isLoading} query={query} />
    </div>
  );
}
