import { create } from "zustand";

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  sourceType: "youtube",
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  seekTarget: null,
  volume: 0.8,
  queue: [],
  playTrack: (track, sourceType = "youtube") =>
    set({
      currentTrack: track,
      sourceType,
      isPlaying: true,
      positionMs: 0,
      durationMs: track?.durationMs || 0
    }),
  pause: () => set({ isPlaying: false }),
  resume: () => set(({ currentTrack }) => ({ isPlaying: Boolean(currentTrack) })),
  togglePlay: () => {
    const { currentTrack, isPlaying } = get();
    set({ isPlaying: Boolean(currentTrack) && !isPlaying });
  },
  seek: (positionMs) => set({ positionMs }),
  setPosition: (positionMs) => set({ positionMs }),
  setSeekTarget: (seekTarget) => set({ seekTarget }),
  setDuration: (durationMs) => set({ durationMs }),
  setVolume: (volume) => set({ volume }),
  setQueue: (queue) => set({ queue }),
  next: () => {
    const { queue, currentTrack } = get();
    if (!queue.length) return;
    const index = queue.findIndex((track) => track.id === currentTrack?.id);
    const nextTrack = queue[(index + 1 + queue.length) % queue.length];
    get().playTrack(nextTrack, "youtube");
  },
  previous: () => {
    const { queue, currentTrack } = get();
    if (!queue.length) return;
    const index = queue.findIndex((track) => track.id === currentTrack?.id);
    const previousTrack = queue[(index - 1 + queue.length) % queue.length];
    get().playTrack(previousTrack, "youtube");
  }
}));
