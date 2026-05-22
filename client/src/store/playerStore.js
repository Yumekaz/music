import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLAYBACK_ENGINES, createPlaybackController } from "../lib/playbackController.js";

export const usePlayerStore = create(
  persist(
    (set, get) => {
      const controller = createPlaybackController({ get, set });

      return {
        currentTrack: null,
        sourceType: "youtube",
        activeEngine: PLAYBACK_ENGINES.NONE,
        playbackFailure: null,
        isPlaying: false,
        isBuffering: false,
        positionMs: 0,
        durationMs: 0,
        seekTarget: null,
        volume: 0.8,
        queue: [],
        queueReadiness: {},
        skippedUnavailableTrackIds: {},
        shuffle: false,
        repeat: "off", // "off" | "all" | "one"
        shortcutsHelpOpen: false,

      getNextTrack: () => {
        const { queue, currentTrack, shuffle, repeat } = get();
        if (repeat === "one") return currentTrack;
        if (!queue.length) return null;

        const index = queue.findIndex((track) => track.id === currentTrack?.id);
        if (shuffle) return null; // Can't reliably pre-buffer random track

        const nextIndex = index + 1;
        if (nextIndex >= queue.length) {
          if (repeat === "all") return queue[0];
          return null;
        }
        return queue[nextIndex];
      },

        playTrack: controller.playTrack,
        pause: controller.pause,
        resume: controller.resume,
      toggleShortcutsHelp: () => set((state) => ({ shortcutsHelpOpen: !state.shortcutsHelpOpen })),
      setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),
        togglePlay: controller.togglePlay,
        seek: controller.seek,
      setPosition: (positionMs) => set({ positionMs }),
      setSeekTarget: (seekTarget) => set({ seekTarget }),
      setDuration: (durationMs) => set({ durationMs }),
        setVolume: controller.setVolume,
      setBuffering: (isBuffering) => set({ isBuffering }),
        setPlaybackFailure: (playbackFailure) => set({ playbackFailure }),

        setQueueReadiness: (queueReadiness) => set({ queueReadiness }),
        mergeQueueReadiness: (queueReadiness) =>
          set((state) => ({ queueReadiness: { ...state.queueReadiness, ...queueReadiness } })),
        clearQueueReadiness: () => set({ queueReadiness: {} }),
        mergeResolvedTrack: (trackId, resolvedTrack) =>
          set((state) => {
            if (!trackId || !resolvedTrack) return state;
            let changed = false;
            const mergeTrack = (track) => {
              if (track?.id !== trackId) return track;
              const nextTrack = {
                ...track,
                ...resolvedTrack,
                id: track.id,
                title: track.title || resolvedTrack.title,
                artistName: track.artistName || resolvedTrack.artistName
              };
              const hasChanged = [
                "videoId",
                "previewUrl",
                "jamendoUrl",
                "durationMs",
                "artworkUrl",
                "albumName"
              ].some((key) => track[key] !== nextTrack[key]);
              if (!hasChanged) return track;
              changed = true;
              return nextTrack;
            };
            const currentTrack = state.currentTrack?.id === trackId
              ? mergeTrack(state.currentTrack)
              : state.currentTrack;
            const queue = state.queue.map(mergeTrack);
            if (!changed) return state;
            return {
              currentTrack,
              queue
            };
          }),

      setQueue: (queue) => set({ queue, skippedUnavailableTrackIds: {} }),
      addToQueue: (track) =>
        set((state) => {
          if (state.queue.some((t) => t.id === track.id)) return state;
          return { queue: [...state.queue, track], skippedUnavailableTrackIds: {} };
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
          return { queue: newQueue, skippedUnavailableTrackIds: {} };
        }),
      removeFromQueue: (trackId) =>
        set((state) => ({
          queue: state.queue.filter((t) => t.id !== trackId),
          skippedUnavailableTrackIds: {}
        })),
      reorderQueue: (fromIndex, toIndex) =>
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, removed);
          return { queue: newQueue, skippedUnavailableTrackIds: {} };
        }),

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off"
        })),

        next: controller.next,
        previous: controller.previous,
        _autoPlay: controller.autoPlay
      };
    },
    {
      name: "music-app-player",
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat
      })
    }
  )
);
