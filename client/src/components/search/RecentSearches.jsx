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

  const recentSearchesClass = "grid gap-[14px]";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const recentChipsClass = "flex flex-wrap gap-[10px]";
  const recentChipClass = "inline-flex items-center gap-[8px] min-h-[36px] pl-[14px] pr-[6px] border border-line rounded-full text-[#dfe7dd] bg-panel text-[0.88rem] cursor-pointer transition-colors duration-[160ms] hover:bg-[#1a241a] hover:border-accent";
  const recentChipTextClass = "max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis";
  const recentChipRemoveClass = "inline-grid place-items-center w-[24px] h-[24px] rounded-full text-muted transition-colors duration-[120ms] hover:text-ink hover:bg-[rgba(255,255,255,0.1)]";

  return (
    <section className={recentSearchesClass}>
      <header className={sectionHeaderClass}>
        <h2 className="m-0 text-[1.2rem] font-bold text-ink">Recent searches</h2>
      </header>
      <div className={recentChipsClass}>
        {recent.map((query) => (
          <button
            key={query}
            type="button"
            className={recentChipClass}
            onClick={() => onSelect(query)}
          >
            <Clock size={14} aria-hidden="true" />
            <span className={recentChipTextClass}>{query}</span>
            <span
              role="button"
              tabIndex={0}
              className={recentChipRemoveClass}
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
