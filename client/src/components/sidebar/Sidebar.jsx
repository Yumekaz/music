import { Home, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { SidebarLibrary } from "./SidebarLibrary.jsx";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Primary">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Home size={18} aria-hidden="true" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Search size={18} aria-hidden="true" />
          <span>Search</span>
        </NavLink>
      </nav>
      <SidebarLibrary />
    </aside>
  );
}
