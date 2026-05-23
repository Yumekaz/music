import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import NowPlaying from "./NowPlaying.jsx";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";

vi.mock("../hooks/useColorExtract.js", () => ({
  useColorExtract: () => null
}));

vi.mock("../hooks/useDirectAudio.js", () => ({
  useDirectAudio: () => ({ current: null })
}));

vi.mock("../components/lyrics/LyricsPanel.jsx", () => ({
  LyricsPanel: () => <div>Lyrics</div>
}));

vi.mock("../components/player/Visualizer.jsx", () => ({
  Visualizer: () => <div>Visualizer</div>
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderNowPlaying(initialEntries = ["/now-playing"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/now-playing" element={<NowPlaying />} />
      </Routes>
    </MemoryRouter>
  );
}

const track = {
  id: "track-test",
  title: "Test Song",
  artistName: "Mihir",
  durationMs: 180000,
  artworkUrl: "",
  externalLinks: {}
};

describe("NowPlaying", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      sourceType: "youtube",
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      volume: 0.8,
      queue: []
    });
    useLibraryStore.setState({
      likedTracks: [],
      playlists: [],
      downloads: [],
      hydrated: true
    });
    useSettingsStore.setState({
      equalizerOpen: false,
      equalizerEnabled: false,
      equalizerPreset: "Normal",
      equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0]
    });
  });

  it("redirects home when there is no current track", () => {
    renderNowPlaying();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(screen.queryByText("Nothing playing")).not.toBeInTheDocument();
  });

  it("closes the equalizer before leaving now playing", () => {
    usePlayerStore.setState({
      currentTrack: track,
      sourceType: "preview",
      durationMs: track.durationMs
    });
    renderNowPlaying();

    fireEvent.click(screen.getByRole("button", { name: "EQ" }));
    expect(screen.getByRole("combobox", { name: "Preset:" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(useSettingsStore.getState().equalizerOpen).toBe(false);
    expect(screen.queryByRole("combobox", { name: "Preset:" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/now-playing");
  });

  it("shows favorite and bottom sheet playlist actions on the full player", async () => {
    usePlayerStore.setState({
      currentTrack: track,
      sourceType: "youtube",
      durationMs: track.durationMs
    });
    useLibraryStore.setState({
      likedTracks: [],
      playlists: [{ id: "playlist-road-trip", name: "Road Trip", tracks: [] }],
      downloads: [],
      hydrated: true
    });

    renderNowPlaying();

    fireEvent.click(screen.getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => {
      expect(useLibraryStore.getState().isLiked(track.id)).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByRole("dialog", { name: "Track options" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to playlist" }));
    fireEvent.click(screen.getByRole("button", { name: "Road Trip" }));

    await waitFor(() => {
      expect(useLibraryStore.getState().playlists[0].tracks).toEqual([track]);
    });
  });
});
