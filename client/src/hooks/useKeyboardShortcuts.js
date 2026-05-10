import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useLibraryStore } from "../store/libraryStore.js";

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e) {
      // Don't intercept when typing in inputs
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

      const state = usePlayerStore.getState();

      switch (e.code) {
        case "Space":
          e.preventDefault();
          state.togglePlay();
          break;
        case "ArrowRight":
          if (state.currentTrack) {
            e.preventDefault();
            const newPos = Math.min(state.positionMs + 5000, state.durationMs);
            state.setPosition(newPos);
            state.setSeekTarget(newPos);
          }
          break;
        case "ArrowLeft":
          if (state.currentTrack) {
            e.preventDefault();
            const newPos = Math.max(state.positionMs - 5000, 0);
            state.setPosition(newPos);
            state.setSeekTarget(newPos);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          state.setVolume(Math.min(state.volume + 0.1, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          state.setVolume(Math.max(state.volume - 0.1, 0));
          break;
        case "KeyN":
          state.next();
          break;
        case "KeyP":
          state.previous();
          break;
        case "KeyS":
          state.toggleShuffle();
          break;
        case "KeyR":
          state.cycleRepeat();
          break;
        case "KeyL":
          if (state.currentTrack) {
            useLibraryStore.getState().toggleLike(state.currentTrack);
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
