import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "./settingsStore.js";
import { usePlayerStore } from "./playerStore.js";

vi.mock("../lib/directAudio.js", () => ({
  playDirectAudio: vi.fn(() => Promise.resolve(true)),
  playDirectAudioSync: vi.fn(() => true),
  syncAudioStateSync: vi.fn(),
  getDirectAudioElement: vi.fn(() => null)
}));

vi.mock("../services/tracks.js", () => ({
  resolveTrack: vi.fn(() => Promise.resolve({ previewUrl: "/mock-preview-url" }))
}));


const track = {
  id: "track-blinding-lights",
  title: "Blinding Lights",
  artistName: "The Weeknd",
  durationMs: 200000
};

describe("playerStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({ mobileBackgroundFallback: false });
    usePlayerStore.setState({
      currentTrack: null,
      sourceType: "youtube",
      activeEngine: "none",
      playbackFailure: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      queue: [],
      queueReadiness: {},
      skippedUnavailableTrackIds: {}
    });
  });

  it("starts a selected track", async () => {
    await usePlayerStore.getState().playTrack(track, "preview");

    expect(usePlayerStore.getState().currentTrack.id).toBe(track.id);
    expect(usePlayerStore.getState().sourceType).toBe("preview");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("uses direct preview playback when a youtube track has a playable preview", async () => {
    await usePlayerStore.getState().playTrack({ ...track, previewUrl: "/api/audio/preview/track-blinding-lights" }, "youtube");

    expect(usePlayerStore.getState().sourceType).toBe("preview");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("keeps Chrome preview-only YouTube tracks foreground-only while hidden", async () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      writable: true,
      configurable: true
    });

    const originalVisibilityState = document.visibilityState;
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
      configurable: true
    });

    const mobileTrack = {
      ...track,
      videoId: "some-video-id",
      previewUrl: "/api/audio/preview/track-blinding-lights"
    };

    try {
      useSettingsStore.setState({ mobileBackgroundFallback: true });
      await usePlayerStore.getState().playTrack(mobileTrack, "youtube");

      expect(usePlayerStore.getState().sourceType).toBe("youtube");
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(usePlayerStore.getState().playbackFailure.message).toContain("30s preview");
    } finally {
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        writable: true,
        configurable: true
      });
      Object.defineProperty(document, "visibilityState", {
        value: originalVisibilityState,
        writable: true,
        configurable: true
      });
    }
  });

  it("advances through the queue", async () => {
    const second = { ...track, id: "track-two", title: "Second" };
    usePlayerStore.getState().setQueue([track, second]);
    await usePlayerStore.getState().playTrack(track, "youtube");
    await usePlayerStore.getState().next();

    expect(usePlayerStore.getState().currentTrack.id).toBe("track-two");
  });

  it("handles play/pause and seeking", async () => {
    await usePlayerStore.getState().playTrack(track, "youtube");
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
