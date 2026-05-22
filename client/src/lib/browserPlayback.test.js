import { describe, expect, it } from "vitest";
import {
  clampPlaybackPositionMs,
  estimateChromeResumePositionMs,
  estimateLoopAlignedPositionMs,
  estimateWallClockPositionMs,
  getBrowserCapabilities,
  isOfficialChromeAndroid,
  shouldUseChromeAndroidBackgroundFallback
} from "./browserPlayback.js";

const chromeAndroidUa = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const samsungUa = "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36";
const edgeUa = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 EdgA/125.0.0.0";
const firefoxUa = "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0";
const webViewUa = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A.240505.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36";

describe("browser playback helpers", () => {
  it("targets official Chrome Android for the fallback", () => {
    expect(isOfficialChromeAndroid({ userAgent: chromeAndroidUa })).toBe(true);
    expect(shouldUseChromeAndroidBackgroundFallback(
      { mobileBackgroundFallback: true },
      { userAgent: chromeAndroidUa }
    )).toBe(true);
  });

  it("does not target other Android browsers that include Chrome in the UA", () => {
    expect(isOfficialChromeAndroid({ userAgent: samsungUa })).toBe(false);
    expect(isOfficialChromeAndroid({ userAgent: edgeUa })).toBe(false);
    expect(isOfficialChromeAndroid({ userAgent: firefoxUa })).toBe(false);
    expect(isOfficialChromeAndroid({ userAgent: webViewUa })).toBe(false);
  });

  it("honors the user setting even on Chrome Android", () => {
    expect(shouldUseChromeAndroidBackgroundFallback(
      { mobileBackgroundFallback: false },
      { userAgent: chromeAndroidUa }
    )).toBe(false);
  });

  it("summarizes the browser capability matrix in one place", () => {
    expect(getBrowserCapabilities(
      { mobileBackgroundFallback: true },
      { userAgent: chromeAndroidUa, mediaSession: {}, wakeLock: {} }
    )).toMatchObject({
      isMobileBrowser: true,
      isOfficialChromeAndroid: true,
      supportsMediaSession: true,
      supportsWakeLock: true,
      chromeBackgroundFallbackEnabled: true,
      backgroundStrategy: "chrome-audio-fallback"
    });
  });

  it("keeps resume aligned to the preview position the user actually heard", () => {
    expect(estimateLoopAlignedPositionMs({
      anchorPositionMs: 50000,
      anchorPreviewSeconds: 25,
      currentPreviewSeconds: 5,
      loopDurationSeconds: 30,
      hiddenAtMs: 1000,
      nowMs: 11000
    })).toBe(65000);
  });

  it("falls back to elapsed preview-loop math without a wall-clock anchor", () => {
    expect(estimateLoopAlignedPositionMs({
      anchorPositionMs: 50000,
      anchorPreviewSeconds: 25,
      currentPreviewSeconds: 5,
      loopDurationSeconds: 30
    })).toBe(60000);
  });

  it("estimates Chrome resume from real elapsed time", () => {
    expect(estimateWallClockPositionMs({
      anchorPositionMs: 50000,
      hiddenAtMs: 1000,
      nowMs: 11000,
      leadMs: 250
    })).toBe(60250);
  });

  it("does not let preview-loop math rewind Chrome behind wall clock", () => {
    const session = {
      anchorPositionMs: 50000,
      anchorPreviewSeconds: 20,
      currentPreviewSeconds: 19,
      loopDurationSeconds: 30,
      hiddenAtMs: 1000,
      durationMs: 200000
    };

    expect(estimateChromeResumePositionMs(session, {
      currentPreviewSeconds: 19,
      loopDurationSeconds: 30,
      nowMs: 11000
    })).toBe(60000);
  });

  it("clamps resume targets near track end", () => {
    expect(clampPlaybackPositionMs(205000, 200000)).toBe(199000);
  });
});
