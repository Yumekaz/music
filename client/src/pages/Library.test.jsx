import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Library from "./Library.jsx";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePlayerStore } from "../store/playerStore.js";

vi.mock("../services/api.js", () => ({
  apiPost: vi.fn()
}));

vi.mock("../components/common/ImageWithFallback.jsx", () => ({
  ImageWithFallback: ({ alt = "", ...props }) => <img alt={alt} {...props} />
}));

const likedTrack = {
  id: "liked-track",
  title: "Liked Track",
  artistName: "Mihir",
  durationMs: 180000,
  artworkUrl: ""
};

describe("Library", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      likedTracks: [likedTrack],
      playlists: [
        {
          id: "playlist-road-trip",
          name: "Road Trip",
          tracks: [likedTrack]
        }
      ],
      hydrated: true,
      hydrate: async () => {}
    });
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      queue: []
    });
  });

  it("renders a library landing with liked songs, playlists, and create playlist", () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Your Library" })).toBeInTheDocument();
    expect(screen.getByText("Liked Songs")).toBeInTheDocument();
    expect(screen.getByText("Road Trip")).toBeInTheDocument();
    expect(screen.getByText("Create playlist")).toBeInTheDocument();
  });

  it("opens liked songs as a collection from the library landing", () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Liked Songs/i }));

    expect(screen.getByRole("heading", { name: "Liked Songs" })).toBeInTheDocument();
    expect(screen.getByText("Liked Track")).toBeInTheDocument();
  });
});
