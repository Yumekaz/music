import { Disc3, Heart, Home, Library, Search } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/now-playing", label: "Now Playing", icon: Disc3 },
  { to: "/library", label: "Library", icon: Library }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="Music App V3 home">
        <span className="brand-mark">M</span>
        <span>Music V3</span>
      </NavLink>
      <nav className="nav-list" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}
