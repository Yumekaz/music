import { useEffect, useRef } from "react";

const BANDS = [
  { label: "60", frequency: 60, type: "lowshelf" },
  { label: "170", frequency: 170, type: "peaking" },
  { label: "310", frequency: 310, type: "peaking" },
  { label: "600", frequency: 600, type: "peaking" },
  { label: "1k", frequency: 1000, type: "peaking" },
  { label: "3k", frequency: 3000, type: "peaking" },
  { label: "6k", frequency: 6000, type: "peaking" },
  { label: "12k", frequency: 12000, type: "highshelf" }
];

export function useEqualizer(audioRef, enabled, gains) {
  const graphRef = useRef(null);

  useEffect(() => {
    if (!enabled || !audioRef.current || graphRef.current || !window.AudioContext) return;

    const context = new AudioContext();
    const source = context.createMediaElementSource(audioRef.current);
    const filters = BANDS.map((band) => {
      const filter = context.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    source.connect(filters[0]);
    filters.forEach((filter, index) => {
      const next = filters[index + 1] || context.destination;
      filter.connect(next);
    });

    graphRef.current = { context, filters };

    return () => {
      graphRef.current = null;
      context.close().catch(() => {});
    };
  }, [audioRef, enabled]);

  useEffect(() => {
    graphRef.current?.filters.forEach((filter, index) => {
      filter.gain.value = gains[index] || 0;
    });
  }, [gains]);

  return {
    bands: BANDS,
    active: Boolean(enabled && graphRef.current)
  };
}
