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
    }))
}));
