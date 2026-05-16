import { create } from "zustand";
import { playDirectAudio } from "../lib/directAudio.js";
import { getRecommendations } from "../services/search.js";

function resolveSourceType(track, sourceType) {
  if (sourceType === "youtube" && !track?.videoId && track?.previewUrl) return "preview";
  return sourceType;
}

function isDirectSource(sourceType) {
  return sourceType === "preview" || sourceType === "jamendo";
}

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  sourceType: "youtube",
  isPlaying: false,
  isBuffering: false,
  positionMs: 0,
  durationMs: 0,
  seekTarget: null,
  volume: 0.8,
  queue: [],
  shuffle: false,
  repeat: "off", // "off" | "all" | "one"

  playTrack: (track, sourceType = "youtube") => {
    const resolvedSourceType = resolveSourceType(track, sourceType);

    if (isDirectSource(resolvedSourceType)) {
      playDirectAudio(track, resolvedSourceType).catch(() => {});
    }

    set({
      currentTrack: track,
      sourceType: resolvedSourceType,
      isPlaying: true,
      positionMs: 0,
      durationMs: track?.durationMs || 0
    });
  },
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
  setBuffering: (isBuffering) => set({ isBuffering }),

  setQueue: (queue) => set({ queue }),
  addToQueue: (track) =>
    set((state) => {
      if (state.queue.some((t) => t.id === track.id)) return state;
      return { queue: [...state.queue, track] };
    }),
  // Insert track immediately after the currently playing track in the queue
  playNext: (track) =>
    set((state) => {
      const idx = state.queue.findIndex((t) => t.id === state.currentTrack?.id);
      const newQueue = [...state.queue];
      if (idx === -1) {
        newQueue.unshift(track);
      } else {
        newQueue.splice(idx + 1, 0, track);
      }
      return { queue: newQueue };
    }),
  removeFromQueue: (trackId) =>
    set((state) => ({ queue: state.queue.filter((t) => t.id !== trackId) })),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  cycleRepeat: () =>
    set((state) => ({
      repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off"
    })),

  next: () => {
    const { queue, currentTrack, shuffle, repeat } = get();

    // Repeat one — just restart the current track
    if (repeat === "one") {
      get().setSeekTarget(0);
      set({ positionMs: 0, isPlaying: true });
      return;
    }

    if (!queue.length) {
      // No queue — auto-play a recommendation
      get()._autoPlay();
      return;
    }

    const index = queue.findIndex((track) => track.id === currentTrack?.id);

    if (shuffle) {
      // Pick a random track that isn't the current one
      const others = queue.filter((_, i) => i !== index);
      if (others.length) {
        const pick = others[Math.floor(Math.random() * others.length)];
        get().playTrack(pick, "youtube");
      }
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        get().playTrack(queue[0], "youtube");
      } else {
        // End of queue, no repeat — auto-play something new
        get()._autoPlay();
      }
      return;
    }

    get().playTrack(queue[nextIndex], "youtube");
  },

  previous: () => {
    const { queue, currentTrack, positionMs } = get();

    // If more than 3 seconds in, restart current track
    if (positionMs > 3000) {
      get().setSeekTarget(0);
      set({ positionMs: 0 });
      return;
    }

    if (!queue.length) return;
    const index = queue.findIndex((track) => track.id === currentTrack?.id);
    const previousTrack = queue[(index - 1 + queue.length) % queue.length];
    get().playTrack(previousTrack, "youtube");
  },

  // Auto-play: fetch a recommendation based on the current track's artist
  _autoPlay: async () => {
    const { currentTrack } = get();
    if (!currentTrack) return;

    const artistName = currentTrack.artistName || currentTrack.artist || "";
    if (!artistName) return;

    try {
      const data = await getRecommendations([artistName]);
      const section = data?.sections?.[0];
      if (!section?.tracks?.length) return;

      // Filter out the track we just played
      const candidates = section.tracks.filter((t) => t.id !== currentTrack.id);
      if (!candidates.length) return;

      // Pick a random one from the recommendations
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      get().playTrack(pick, "youtube");
    } catch {
      // Failed to fetch recommendations, just stop
    }
  }
}));
