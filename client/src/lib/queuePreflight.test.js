import { describe, expect, it } from "vitest";
import {
  QUEUE_READINESS,
  classifyTrackReadiness,
  getQueuePreflightWindow,
  preflightTrack
} from "./queuePreflight.js";

const chromeAndroid = {
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
};

describe("queue preflight", () => {
  it("marks Chrome YouTube tracks without full background audio as foreground-only", () => {
    const readiness = classifyTrackReadiness(
      { id: "one", title: "Song", videoId: "abc", previewUrl: "/thirty-second-preview.mp3" },
      {
        sourceType: "youtube",
        settings: { mobileBackgroundFallback: true },
        navigatorLike: chromeAndroid
      }
    );

    expect(readiness.status).toBe(QUEUE_READINESS.FOREGROUND_ONLY);
    expect(readiness.reason).toContain("30s preview");
  });

  it("does not treat Jamendo as a Chrome YouTube background fallback", () => {
    const readiness = classifyTrackReadiness(
      { id: "one", title: "Song", videoId: "abc", previewUrl: "/preview.mp3", jamendoUrl: "/full-track.mp3" },
      {
        sourceType: "youtube",
        settings: { mobileBackgroundFallback: true },
        navigatorLike: chromeAndroid
      }
    );

    expect(readiness.status).toBe(QUEUE_READINESS.FOREGROUND_ONLY);
    expect(readiness.reason).toContain("Jamendo");
  });

  it("does not punish non-Chrome browser paths for missing preview", () => {
    const readiness = classifyTrackReadiness(
      { id: "one", title: "Song", videoId: "abc" },
      {
        sourceType: "youtube",
        settings: { mobileBackgroundFallback: true },
        navigatorLike: { userAgent: "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0" }
      }
    );

    expect(readiness.status).toBe(QUEUE_READINESS.READY);
  });

  it("preflights current plus next three tracks", () => {
    const currentTrack = { id: "current" };
    const queue = [
      currentTrack,
      { id: "two" },
      { id: "three" },
      { id: "four" },
      { id: "five" }
    ];

    expect(getQueuePreflightWindow({ currentTrack, queue }).map((track) => track.id))
      .toEqual(["current", "two", "three", "four"]);
  });

  it("resolves a missing source before declaring readiness", async () => {
    const result = await preflightTrack(
      { id: "missing", title: "Song", artistName: "Artist" },
      {
        sourceType: "youtube",
        resolveTrack: () => Promise.resolve({ videoId: "resolved-video" })
      }
    );

    expect(result.readiness.status).toBe(QUEUE_READINESS.READY);
    expect(result.track.videoId).toBe("resolved-video");
  });

  it("reports provider timeout during preflight", async () => {
    const error = new Error("timeout");
    error.name = "TimeoutError";

    const result = await preflightTrack(
      { id: "timeout", title: "Song", artistName: "Artist" },
      {
        sourceType: "youtube",
        resolveTrack: () => Promise.reject(error)
      }
    );

    expect(result.readiness.status).toBe(QUEUE_READINESS.PROVIDER_TIMEOUT);
  });
});
