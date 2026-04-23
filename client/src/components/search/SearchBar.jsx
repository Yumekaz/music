import { Search } from "lucide-react";

export function SearchBar({ value, onChange }) {
  return (
    <label className="search-bar">
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search songs, artists, albums"
        aria-label="Search songs, artists, albums"
      />
    </label>
  );
}
