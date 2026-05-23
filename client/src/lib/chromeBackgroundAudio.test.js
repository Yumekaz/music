import { describe, expect, it } from "vitest";
import {
  getChromeBackgroundAudioSourceType,
  getChromeForegroundOnlyReason,
  hasChromeBackgroundAudioSource
} from "./chromeBackgroundAudio.js";

describe("Chrome background audio helpers", () => {
  it("accepts only full direct audio as Chrome background audio", () => {
    expect(hasChromeBackgroundAudioSource({ previewUrl: "/preview.mp3" })).toBe(false);
    expect(getChromeBackgroundAudioSourceType({ previewUrl: "/preview.mp3" })).toBe("");
    expect(hasChromeBackgroundAudioSource({ jamendoUrl: "/full.mp3", previewUrl: "/preview.mp3" })).toBe(true);
    expect(getChromeBackgroundAudioSourceType({ jamendoUrl: "/full.mp3" })).toBe("jamendo");
  });

  it("explains preview-only Chrome fallback clearly", () => {
    expect(getChromeForegroundOnlyReason({ previewUrl: "/preview.mp3" })).toContain("30s preview");
    expect(getChromeForegroundOnlyReason({})).toContain("unavailable");
  });
});
