import { describe, expect, it } from "vitest";
import { rankCandidates, scoreCandidate } from "../src/utils/ranking.js";

describe("ranking", () => {
  it("rewards exact title, artist, mbid, duration, and playable sources", () => {
    const score = scoreCandidate(
      {
        title: "Blinding Lights",
        artistName: "The Weeknd",
        albumName: "After Hours",
        durationMs: 200000,
        mbid: "mbid",
        videoId: "abc",
        previewUrl: "preview"
      },
      {
        title: "Blinding Lights",
        artistName: "The Weeknd",
        albumName: "After Hours",
        durationMs: 201000
      }
    );

    expect(score).toBeGreaterThan(120);
  });

  it("sorts the strongest match first", () => {
    const candidates = rankCandidates(
      [
        { title: "Random", artistName: "Someone", popularity: 99 },
        { title: "Kesariya", artistName: "Arijit Singh", mbid: "x", videoId: "y" }
      ],
      { title: "Kesariya", artistName: "Arijit Singh" }
    );

    expect(candidates[0].title).toBe("Kesariya");
  });
});
