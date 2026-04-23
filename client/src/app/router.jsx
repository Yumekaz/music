import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";

const Home = lazy(() => import("../pages/Home.jsx"));
const Search = lazy(() => import("../pages/Search.jsx"));
const NowPlaying = lazy(() => import("../pages/NowPlaying.jsx"));
const Artist = lazy(() => import("../pages/Artist.jsx"));
const Album = lazy(() => import("../pages/Album.jsx"));
const Library = lazy(() => import("../pages/Library.jsx"));
const Playlist = lazy(() => import("../pages/Playlist.jsx"));
const Track = lazy(() => import("../pages/Track.jsx"));

function Page({ children }) {
  return <Suspense fallback={<LoadingSkeleton label="Loading view" />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Page><Home /></Page> },
      { path: "search", element: <Page><Search /></Page> },
      { path: "now-playing", element: <Page><NowPlaying /></Page> },
      { path: "artists/:id", element: <Page><Artist /></Page> },
      { path: "albums/:id", element: <Page><Album /></Page> },
      { path: "tracks/:id", element: <Page><Track /></Page> },
      { path: "library", element: <Page><Library /></Page> },
      { path: "playlists/:id", element: <Page><Playlist /></Page> }
    ]
  }
]);
