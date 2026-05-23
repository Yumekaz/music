import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Playlist from "./Playlist.jsx";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";

vi.mock("../hooks/useColorExtract.js", () => ({
  useColorExtract: () => null
}));

vi.mock("../components/common/ImageWithFallback.jsx", () => ({
  ImageWithFallback: ({ alt = "", ...props }) => <img alt={alt} {...props} />
}));

const track = {
  id: "playlist-track",
  title: "Playlist Track",
  artistName: "Mihir",
  durationMs: 180000,
  artworkUrl: ""
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderPlaylist() {
  return render(
    <MemoryRouter initialEntries={["/playlists/playlist-delete-test"]}>
      <LocationProbe />
      <Routes>
        <Route path="/library" element={<div>Library home</div>} />
        <Route path="/playlists/:id" element={<Playlist />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Playlist", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      playlists: [
        {
          id: "playlist-delete-test",
          name: "Road Trip",
          tracks: [track]
        }
      ],
      hydrated: true
    });
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      queue: []
    });
  });

  it("asks for confirmation before deleting a playlist", () => {
    renderPlaylist();

    fireEvent.click(screen.getByRole("button", { name: "Delete playlist" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Road Trip?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep playlist" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useLibraryStore.getState().playlists.some((playlist) => playlist.id === "playlist-delete-test")).toBe(true);
  });

  it("deletes only after confirmation", async () => {
    renderPlaylist();

    fireEvent.click(screen.getByRole("button", { name: "Delete playlist" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete playlist" }).at(-1));

    await waitFor(() => {
      expect(useLibraryStore.getState().playlists.some((playlist) => playlist.id === "playlist-delete-test")).toBe(false);
      expect(screen.getByTestId("location")).toHaveTextContent("/library");
    });
    expect(screen.getByText("Library home")).toBeInTheDocument();
  });
});
