import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "./playerStore.js";

vi.mock("../lib/directAudio.js", () => ({
  playDirectAudio: vi.fn(() => Promise.resolve(true)),
  playDirectAudioSync: vi.fn(() => true)
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

  it("handles play/pause and seeking", () => {
    usePlayerStore.getState().playTrack(track, "youtube");
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    usePlayerStore.getState().pause();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    usePlayerStore.getState().resume();
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    usePlayerStore.getState().setSeekTarget(5000);
    expect(usePlayerStore.getState().seekTarget).toBe(5000);
  });

  it("reorders the queue", () => {
    const track1 = { ...track, id: "track-1" };
    const track2 = { ...track, id: "track-2" };
    const track3 = { ...track, id: "track-3" };
    usePlayerStore.getState().setQueue([track1, track2, track3]);

    // Move track-1 from index 0 to index 2
    usePlayerStore.getState().reorderQueue(0, 2);

    const queue = usePlayerStore.getState().queue;
    expect(queue[0].id).toBe("track-2");
    expect(queue[1].id).toBe("track-3");
    expect(queue[2].id).toBe("track-1");
  });
});
