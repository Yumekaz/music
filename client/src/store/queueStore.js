import { create } from "zustand";

export const useQueueStore = create((set) => ({
  queue: [],
  setQueue: (queue) => set({ queue }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (id) => set((state) => ({ queue: state.queue.filter((track) => track.id !== id) }))
}));
