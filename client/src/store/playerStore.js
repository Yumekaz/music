import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playDirectAudio, playDirectAudioSync, syncAudioStateSync, getDirectAudioElement } from "../lib/directAudio.js";
import { getRecommendations } from "../services/search.js";
import { resolveTrack } from "../services/tracks.js";
import { useSettingsStore } from "./settingsStore.js";

function resolveSourceType(track, sourceType) {
  if (sourceType === "youtube" && !track?.videoId && track?.previewUrl) return "preview";

  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
  const settings = useSettingsStore.getState();
  if (isMobile && isHidden && settings?.mobileBackgroundFallback && sourceType === "youtube" && track?.previewUrl) {
    return "preview";
  }

  return sourceType;
}

function isDirectSource(sourceType) {
  return sourceType === "preview" || sourceType === "jamendo";
}

export const usePlayerStore = create(
  persist(
    (set, get) => ({
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

      playTrack: async (track, sourceType = "youtube") => {
        const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const settings = useSettingsStore.getState();
        const { volume } = get();

        let trackWithPreview = track;
        if (
          isMobile &&
          settings?.mobileBackgroundFallback &&
          sourceType === "youtube" &&
          !track.previewUrl
        ) {
          // Set loading/buffering state immediately so UI is responsive
          set({
            currentTrack: track,
            sourceType: "youtube",
            isPlaying: true,
            isBuffering: true,
            positionMs: 0,
            durationMs: track?.durationMs || 0
          });

          // Play silence synchronously to unlock the audio element on mobile
          syncAudioStateSync(track, "youtube", true, volume);

          try {
            const title = track.title || "";
            const artist = track.artistName || track.artist || "";
            if (title) {
              const resolved = await resolveTrack(title, artist);
              if (resolved && resolved.previewUrl) {
                trackWithPreview = {
                  ...track,
                  previewUrl: resolved.previewUrl,
                  jamendoUrl: resolved.jamendoUrl || track.jamendoUrl
                };
              }
            }
          } catch (err) {
            console.warn("Failed to resolve preview URL before playing:", err);
          }
        }

        const resolvedSourceType = resolveSourceType(trackWithPreview, sourceType);

        syncAudioStateSync(trackWithPreview, resolvedSourceType, true, volume);

        set({
          currentTrack: trackWithPreview,
          sourceType: resolvedSourceType,
          isPlaying: true,
          isBuffering: false,
          positionMs: 0,
          durationMs: trackWithPreview?.durationMs || 0
        });
      },
      pause: () => {
        const { currentTrack, sourceType, volume } = get();
        syncAudioStateSync(currentTrack, sourceType, false, volume);
        set({ isPlaying: false });
      },
      resume: () => {
        const { currentTrack, sourceType, volume } = get();
        if (currentTrack) {
          syncAudioStateSync(currentTrack, sourceType, true, volume);
        }
        set(({ currentTrack }) => ({ isPlaying: Boolean(currentTrack) }));
      },
      toggleShortcutsHelp: () => set((state) => ({ shortcutsHelpOpen: !state.shortcutsHelpOpen })),
      setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),
      togglePlay: () => {
        const { currentTrack, isPlaying, sourceType, volume } = get();
        const nextPlaying = Boolean(currentTrack) && !isPlaying;
        if (currentTrack) {
          syncAudioStateSync(currentTrack, sourceType, nextPlaying, volume);
        }
        set({ isPlaying: nextPlaying });
      },
      seek: (positionMs) => set({ positionMs }),
      setPosition: (positionMs) => set({ positionMs }),
      setSeekTarget: (seekTarget) => set({ seekTarget }),
      setDuration: (durationMs) => set({ durationMs }),
      setVolume: (volume) => {
        set({ volume });
        const { currentTrack, sourceType, isPlaying } = get();
        syncAudioStateSync(currentTrack, sourceType, isPlaying, volume);
      },
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
      reorderQueue: (fromIndex, toIndex) =>
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, removed);
          return { queue: newQueue };
        }),

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
          if (typeof Audio !== "undefined") {
            const audio = getDirectAudioElement();
            if (audio) audio.currentTime = 0;
          }
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
          if (typeof Audio !== "undefined") {
            const audio = getDirectAudioElement();
            if (audio) audio.currentTime = 0;
          }
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
    }),
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
