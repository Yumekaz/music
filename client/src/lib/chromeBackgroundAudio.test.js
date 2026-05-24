import { describe, expect, it } from "vitest";
import {
  getChromeBackgroundAudioSourceType,
  getChromeForegroundOnlyReason,
  hasChromeBackgroundAudioSource
} from "./chromeBackgroundAudio.js";

describe("Chrome background audio helpers", () => {
  it("rejects previews and Jamendo matches as YouTube background audio", () => {
    expect(hasChromeBackgroundAudioSource({ previewUrl: "/preview.mp3" })).toBe(false);
    expect(getChromeBackgroundAudioSourceType({ previewUrl: "/preview.mp3" })).toBe("");
    expect(hasChromeBackgroundAudioSource({ jamendoUrl: "/full.mp3", previewUrl: "/preview.mp3" })).toBe(false);
    expect(getChromeBackgroundAudioSourceType({ jamendoUrl: "/full.mp3" })).toBe("");
  });

  it("explains preview-only Chrome fallback clearly", () => {
    expect(getChromeForegroundOnlyReason({ previewUrl: "/preview.mp3" })).toContain("30s preview");
    expect(getChromeForegroundOnlyReason({})).toContain("unavailable");
  });

  it("explains why Jamendo is not used for YouTube background", () => {
    expect(getChromeForegroundOnlyReason({ jamendoUrl: "/wrong-song.mp3" })).toContain("Jamendo");
  });
});
