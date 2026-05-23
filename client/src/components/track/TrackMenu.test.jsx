import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { TrackMenu } from "./TrackMenu.jsx";
import { useLibraryStore } from "../../store/libraryStore.js";

const track = {
  id: "track-menu-test",
  title: "Menu Test",
  artistName: "Mihir",
  durationMs: 180000,
  artworkUrl: ""
};

describe("TrackMenu", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      likedTracks: [],
      playlists: [],
      downloads: [],
      hydrated: true
    });
  });

  it("can create a playlist from the add-to-playlist submenu", async () => {
    render(
      <MemoryRouter>
        <TrackMenu track={track} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("button", { name: /Add to playlist/i }));
    fireEvent.click(screen.getByRole("button", { name: /Create playlist/i }));

    await waitFor(() => {
      expect(
        useLibraryStore
          .getState()
          .playlists.some((playlist) => playlist.tracks?.some((item) => item.id === track.id))
      ).toBe(true);
    });
  });
});
