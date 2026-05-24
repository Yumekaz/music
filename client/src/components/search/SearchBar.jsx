import { Search } from "lucide-react";

export function SearchBar({ value, onChange }) {
  const searchBarClass = "flex items-center gap-[12px] w-full max-w-[760px] min-h-[56px] px-[18px] border border-line rounded-[8px] bg-panel text-muted";
  const searchInputClass = "w-full border-0 outline-none text-ink bg-transparent";

  return (
    <label className={searchBarClass}>
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search songs, artists, albums"
        aria-label="Search songs, artists, albums"
        className={searchInputClass}
      />
    </label>
  );
}
