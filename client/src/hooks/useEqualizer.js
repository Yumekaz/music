import { useEffect } from "react";
import { getBiquadFilters, BANDS } from "../lib/directAudio.js";

export function useEqualizer(audioRef, enabled, gains) {
  useEffect(() => {
    const filters = getBiquadFilters();
    if (!filters || filters.length === 0) return;

    filters.forEach((filter, index) => {
      // If disabled, set gain to 0 (flat), otherwise use user gains
      filter.gain.value = enabled ? (gains[index] || 0) : 0;
    });
  }, [enabled, gains]);

  return {
    bands: BANDS,
    active: Boolean(enabled)
  };
}
