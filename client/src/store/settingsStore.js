import { create } from "zustand";

export const useSettingsStore = create((set) => ({
  equalizerOpen: false,
  equalizerPreset: "Normal",
  equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0],
  setEqualizerOpen: (equalizerOpen) => set({ equalizerOpen }),
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
}));
