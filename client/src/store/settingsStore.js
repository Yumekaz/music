import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      equalizerOpen: false,
      equalizerEnabled: false,
      equalizerPreset: "Normal",
      equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0],
      setEqualizerOpen: (equalizerOpen) => set({ equalizerOpen }),
      setEqualizerEnabled: (equalizerEnabled) => set({ equalizerEnabled }),
      setEqualizerPreset: (equalizerPreset, equalizerGains) => set({ equalizerPreset, equalizerGains }),
      setBandGain: (index, value) =>
        set((state) => ({
          equalizerPreset: "Custom",
          equalizerGains: state.equalizerGains.map((gain, gainIndex) => (gainIndex === index ? value : gain))
        })),

      // Crossfade: 0 = off, 1-12 = seconds of overlap
      crossfadeDuration: 2,
      setCrossfadeDuration: (crossfadeDuration) => set({ crossfadeDuration }),

      // YouTube playback quality
      playbackQuality: "default", // 'default'|'small'|'medium'|'large'|'hd720'|'hd1080'|'highres'
      youtubeAvailableQualities: [],
      setPlaybackQuality: (playbackQuality) => set({ playbackQuality }),
      setYoutubeAvailableQualities: (youtubeAvailableQualities) => set({ youtubeAvailableQualities }),

      // Official Chrome Android background playback fallback
      mobileBackgroundFallback: true,
      setMobileBackgroundFallback: (mobileBackgroundFallback) => set({ mobileBackgroundFallback }),
    }),
    {
      name: "music-app-settings",
      partialize: (state) => ({
        equalizerEnabled: state.equalizerEnabled,
        equalizerPreset: state.equalizerPreset,
        equalizerGains: state.equalizerGains,
        crossfadeDuration: state.crossfadeDuration,
        playbackQuality: state.playbackQuality,
        mobileBackgroundFallback: state.mobileBackgroundFallback,
      }),
      merge: (persistedState, currentState) => {
        const saved = persistedState && typeof persistedState === "object" ? persistedState : {};
        return {
          ...currentState,
          ...saved,
          equalizerEnabled:
            typeof saved.equalizerEnabled === "boolean"
              ? saved.equalizerEnabled
              : Boolean(saved.equalizerOpen),
          equalizerOpen: false
        };
      }
    }
  )
);
