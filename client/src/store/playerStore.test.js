import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "./playerStore.js";

vi.mock("../lib/directAudio.js", () => ({
  playDirectAudio: vi.fn(() => Promise.resolve(true))
}));

const track = {
  id: "track-blinding-lights",
  title: "Blinding Lights",
  artistName: "The Weeknd",
  durationMs: 200000
};

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      sourceType: "youtube",
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      queue: []
    });
  });

  it("starts a selected track", () => {
    usePlayerStore.getState().playTrack(track, "preview");

    expect(usePlayerStore.getState().currentTrack.id).toBe(track.id);
    expect(usePlayerStore.getState().sourceType).toBe("preview");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("uses direct preview playback when a youtube track has a playable preview", () => {
    usePlayerStore.getState().playTrack({ ...track, previewUrl: "/api/audio/preview/track-blinding-lights" }, "youtube");

    expect(usePlayerStore.getState().sourceType).toBe("preview");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("advances through the queue", () => {
    const second = { ...track, id: "track-two", title: "Second" };
    usePlayerStore.getState().setQueue([track, second]);
    usePlayerStore.getState().playTrack(track, "youtube");
    usePlayerStore.getState().next();

    expect(usePlayerStore.getState().currentTrack.id).toBe("track-two");
  });
});
