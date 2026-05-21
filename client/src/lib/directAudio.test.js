import { describe, expect, it } from "vitest";
import { audioSourceMatches } from "./directAudio.js";

describe("direct audio source matching", () => {
  it("treats relative and resolved browser audio URLs as the same source", () => {
    const resolved = new URL("/api/audio/preview/track-kesariya", window.location.href).href;
    const audio = {
      currentSrc: resolved,
      src: resolved
    };

    expect(audioSourceMatches(audio, "/api/audio/preview/track-kesariya")).toBe(true);
  });

  it("detects different audio sources", () => {
    const resolved = new URL("/api/audio/preview/track-kesariya", window.location.href).href;
    const audio = {
      currentSrc: resolved,
      src: resolved
    };

    expect(audioSourceMatches(audio, "/api/audio/preview/track-pasoori")).toBe(false);
  });
});
