import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { getDirectAudioElement, pauseDirectAudio } from "../lib/directAudio.js";

/**
 * Chrome Android aggressively throttles / freezes background tabs.
 *
 * This hook implements three mitigations:
 *
 * 1. **Wake Lock API** – requests a "screen" wake lock while audio is playing
 *    so the OS keeps the process alive longer. Chrome Android supports this.
 *
 * 2. **visibilitychange recovery** – when the user returns to the tab after
 *    Chrome froze it, the YouTube iframe will have been paused by the browser.
 *    We detect the desync and attempt to resume playback automatically.
 *
 * 3. **Silent audio keepalive** – while the YouTube source is active, we play
 *    a near-silent tone through a real <audio> element. Chrome is far less
 *    aggressive about freezing a tab that has an actively playing <audio>
 *    element (as opposed to only an iframe). This buys significant extra
 *    background time on Chrome Android.
 */
export function useBackgroundPlayback() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const sourceType = usePlayerStore((state) => state.sourceType);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const wakeLockRef = useRef(null);
  const fallbackTriggeredRef = useRef(false);

  // ── 1. Wake Lock ──────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      // Release any existing wake lock
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock request failed (e.g. low battery, page not visible)
      }
    }

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isPlaying, currentTrack]);

  // Re-acquire wake lock when the tab becomes visible again
  // (Chrome releases wake locks on visibility change)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && isPlaying && currentTrack) {
        if (!wakeLockRef.current && "wakeLock" in navigator) {
          navigator.wakeLock.request("screen").then((lock) => {
            wakeLockRef.current = lock;
            lock.addEventListener("release", () => {
              wakeLockRef.current = null;
            });
          }).catch(() => {});
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isPlaying, currentTrack]);

  // ── 2. Visibility change & Background playback logic ───────────
  // Automatically switch to audio preview if browser is minimized on mobile,
  // and recover when returning to the tab.
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const settings = useSettingsStore.getState();

    if (document.visibilityState === "hidden") {
      if (
        isMobile &&
        settings.mobileBackgroundFallback &&
        isPlaying &&
        sourceType === "youtube" &&
        currentTrack?.previewUrl
      ) {
        fallbackTriggeredRef.current = true;
        const currentPos = usePlayerStore.getState().positionMs;
        usePlayerStore.setState({
          sourceType: "preview",
          seekTarget: currentPos
        });
      }
    } else {
      if (sourceType === "youtube") {
        fallbackTriggeredRef.current = false;
      }
    }
  }, [isPlaying, sourceType, currentTrack]);

  useEffect(() => {
    function handleVisibilityChange() {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const settings = useSettingsStore.getState();
      const state = usePlayerStore.getState();

      if (document.visibilityState === "hidden") {
        if (
          isMobile &&
          settings.mobileBackgroundFallback &&
          state.isPlaying &&
          state.sourceType === "youtube" &&
          state.currentTrack?.previewUrl
        ) {
          fallbackTriggeredRef.current = true;
          const currentPos = state.positionMs;
          usePlayerStore.setState({
            sourceType: "preview",
            seekTarget: currentPos
          });
        }
      } else if (document.visibilityState === "visible") {
        if (fallbackTriggeredRef.current) {
          fallbackTriggeredRef.current = false;
          
          const audio = getDirectAudioElement();
          const currentPos = audio ? audio.currentTime * 1000 : state.positionMs;
          
          pauseDirectAudio();
          
          usePlayerStore.setState({
            sourceType: "youtube",
            seekTarget: currentPos
          });
        } else {
          // When the user returns to the tab, check if our store says "playing"
          // but the actual media has been paused by Chrome's freezer.
          if (!state.isPlaying || !state.currentTrack) return;

          if (state.sourceType === "preview" || state.sourceType === "jamendo") {
            const audio = getDirectAudioElement();
            if (audio && audio.paused && audio.src) {
              audio.play().catch(() => {});
            }
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);
}
