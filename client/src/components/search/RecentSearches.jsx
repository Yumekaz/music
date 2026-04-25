import { Clock, X } from "lucide-react";

const STORAGE_KEY = "music-v3-recent-searches";
const MAX_RECENT = 8;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecentSearch(query) {
  if (!query || !query.trim()) return;
  const trimmed = query.trim();
  const current = getRecentSearches().filter((q) => q !== trimmed);
  current.unshift(trimmed);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
}

function removeRecentSearch(query) {
  const current = getRecentSearches().filter((q) => q !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function RecentSearches({ onSelect }) {
  const recent = getRecentSearches();
  if (!recent.length) return null;

  function handleRemove(e, query) {
    e.stopPropagation();
    removeRecentSearch(query);
    // Force re-render by dispatching a storage event
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <section className="recent-searches">
      <header className="section-header">
        <h2>Recent searches</h2>
      </header>
      <div className="recent-chips">
        {recent.map((query) => (
          <button
            key={query}
            type="button"
            className="recent-chip"
            onClick={() => onSelect(query)}
          >
            <Clock size={14} aria-hidden="true" />
            <span>{query}</span>
            <span
              role="button"
              tabIndex={0}
              className="recent-chip-remove"
              onClick={(e) => handleRemove(e, query)}
              aria-label={`Remove ${query}`}
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
