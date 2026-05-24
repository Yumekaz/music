import { Home, Search, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { SidebarLibrary } from "./SidebarLibrary.jsx";

export function Sidebar() {
  const navItemClass = ({ isActive }) =>
    `inline-flex items-center gap-[10px] py-[10px] px-[12px] rounded-lg font-semibold transition-colors ${
      isActive ? "text-ink" : "text-muted hover:text-ink"
    }`;

  return (
    <aside className="hidden md:flex sticky top-0 h-[100svh] flex-col gap-0 border-r border-line bg-[rgba(8,11,10,0.88)] backdrop-blur-[18px] overflow-hidden z-20">
      <nav className="flex flex-col gap-[2px] pt-[14px] px-[14px] pb-[8px]" aria-label="Primary">
        <NavLink to="/" className={navItemClass}>
          <Home size={18} aria-hidden="true" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={navItemClass}>
          <Search size={18} aria-hidden="true" />
          <span>Search</span>
        </NavLink>
      </nav>
      <SidebarLibrary />
      <nav className="flex flex-col gap-[2px] pt-[8px] px-[14px] pb-[14px] border-t border-[#1a201a] mt-auto" aria-label="Utility">
        <NavLink to="/settings" className={navItemClass}>
          <Settings size={18} aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
