import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SearchResults } from "./SearchResults.jsx";

const data = {
  tracks: [
    {
      id: "track-kesariya",
      title: "Kesariya",
      artistName: "Arijit Singh",
      artistId: "artist-arijit",
      albumName: "Brahmastra",
      durationMs: 268000,
      artworkUrl: "",
      availableProviders: ["youtube"],
      externalLinks: { youtube: "https://youtube.com" }
    }
  ],
  artists: [{ id: "artist-arijit", name: "Arijit Singh", imageUrl: "" }],
  albums: [{ id: "album-brahmastra", title: "Brahmastra", artworkUrl: "" }]
};

describe("SearchResults", () => {
  it("renders grouped search results", () => {
    render(
      <MemoryRouter>
        <SearchResults data={data} query="kesariya" />
      </MemoryRouter>
    );

    expect(screen.getByText("Kesariya")).toBeInTheDocument();
    expect(screen.getByText("Artists")).toBeInTheDocument();
    expect(screen.getByText("Albums")).toBeInTheDocument();
  });
});
