import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTrack } from "../services/tracks.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { QUEUE_READINESS } from "./queuePreflight.js";
import {
  PLAYBACK_ENGINES,
  createPlaybackController,
  resolvePlaybackEngine
} from "./playbackController.js";

vi.mock("./directAudio.js", () => ({
  getDirectAudioElement: vi.fn(() => null),
  syncAudioStateSync: vi.fn()
}));

vi.mock("../services/tracks.js", () => ({
  resolveTrack: vi.fn(() => Promise.resolve({ previewUrl: "/preview.mp3" }))
}));

vi.mock("../services/search.js", () => ({
  getRecommendations: vi.fn(() => Promise.resolve({ sections: [] }))
}));

const track = {
  id: "track-one",
  title: "Track One",
  artistName: "Artist",
  videoId: "video-one",
  durationMs: 180000
};

function createTestController(initial = {}) {
  let state = {
    currentTrack: null,
    sourceType: "youtube",
    isPlaying: false,
    volume: 0.8,
    queue: [],
    queueReadiness: {},
    skippedUnavailableTrackIds: {},
    repeat: "off",
    shuffle: false,
    ...initial
  };

  const set = (patch) => {
    state = {
      ...state,
      ...(typeof patch === "function" ? patch(state) : patch)
    };
  };
  const get = () => state;

  return {
    controller: createPlaybackController({ get, set }),
    getState: get
  };
}

describe("playback controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ mobileBackgroundFallback: false });
  });

  it("resolves active engine from source and browser capability", () => {
    expect(resolvePlaybackEngine(track, "youtube", { mobileBackgroundFallback: false }))
      .toBe(PLAYBACK_ENGINES.YOUTUBE_IFRAME);

    expect(resolvePlaybackEngine(track, "youtube", { mobileBackgroundFallback: true }, {
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
    })).toBe(PLAYBACK_ENGINES.YOUTUBE_IFRAME);

    expect(resolvePlaybackEngine({ ...track, jamendoUrl: "/full-track.mp3" }, "youtube", { mobileBackgroundFallback: true }, {
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
    })).toBe(PLAYBACK_ENGINES.YOUTUBE_IFRAME);

    expect(resolvePlaybackEngine({ ...track, previewUrl: "/preview.mp3" }, "preview", {}))
      .toBe(PLAYBACK_ENGINES.DIRECT_AUDIO);
  });

  it("does not use a 30-second preview as Chrome background playback while hidden", async () => {
    const originalUserAgent = navigator.userAgent;
    const originalVisibilityState = document.visibilityState;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      writable: true,
      configurable: true
    });
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
      configurable: true
    });
    useSettingsStore.setState({ mobileBackgroundFallback: true });

    try {
      const { controller, getState } = createTestController();
      await controller.playTrack({ ...track, previewUrl: "/preview.mp3" }, "youtube");

      expect(getState()).toMatchObject({
        sourceType: "youtube",
        activeEngine: PLAYBACK_ENGINES.YOUTUBE_IFRAME,
        isPlaying: false
      });
      expect(getState().playbackFailure.message).toContain("30s preview");
      expect(resolveTrack).not.toHaveBeenCalled();
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

  it("routes play, pause, seek, and volume through one command layer", async () => {
    const { controller, getState } = createTestController();

    await controller.playTrack(track, "youtube");
    expect(getState()).toMatchObject({
      currentTrack: track,
      sourceType: "youtube",
      activeEngine: PLAYBACK_ENGINES.YOUTUBE_IFRAME,
      isPlaying: true
    });

    controller.pause();
    expect(getState().isPlaying).toBe(false);

    controller.seek(4200);
    expect(getState()).toMatchObject({ positionMs: 4200, seekTarget: 4200 });

    controller.setVolume(0.4);
    expect(getState().volume).toBe(0.4);
  });

  it("skips one unavailable queued track and continues", async () => {
    const bad = { ...track, id: "bad", title: "Bad" };
    const good = { ...track, id: "good", title: "Good", videoId: "good-video" };
    const { controller, getState } = createTestController({
      currentTrack: track,
      queue: [track, bad, good],
      queueReadiness: {
        bad: { status: QUEUE_READINESS.UNAVAILABLE, reason: "No source" },
        good: { status: QUEUE_READINESS.READY, reason: "Ready" }
      }
    });

    await controller.next();

    expect(getState().currentTrack.id).toBe("good");
    expect(getState().skippedUnavailableTrackIds.bad).toBe(true);
    expect(getState().playbackFailure.message).toBe("Track unavailable");
  });
});
