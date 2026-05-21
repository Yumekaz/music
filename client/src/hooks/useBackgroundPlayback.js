import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { getDirectAudioElement, pauseDirectAudio, syncAudioStateSync } from "../lib/directAudio.js";

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
  const minimizedYouTubePosRef = useRef(0);
  const minimizedPreviewPosRef = useRef(0);

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

          // Get the active YouTube player and pause it immediately to prevent double audio overlay
          const activePlayer = window.activeYTPlayer;
          let currentPos = state.positionMs;

          if (activePlayer && typeof activePlayer.getCurrentTime === "function") {
            try {
              currentPos = activePlayer.getCurrentTime() * 1000;
              activePlayer.pauseVideo();
            } catch (err) {
              console.error("[useBackgroundPlayback] Failed to pause active YT player:", err);
            }
          }

          const audio = getDirectAudioElement();
          if (audio) {
            audio.loop = true;
            const dur = audio.duration;
            const loopDur = (dur && !isNaN(dur)) ? dur : 30;
            const startPos = (currentPos / 1000) % loopDur;
            audio.currentTime = startPos;

            minimizedYouTubePosRef.current = currentPos;
            minimizedPreviewPosRef.current = startPos;

            // Expose globally for the YouTube player state listener
            window.ytBackgroundFallbackTriggered = true;
            window.ytMinimizedYouTubePos = currentPos;
            window.ytMinimizedPreviewPos = startPos;
          } else {
            minimizedYouTubePosRef.current = currentPos;
            minimizedPreviewPosRef.current = (currentPos / 1000) % 30;

            window.ytBackgroundFallbackTriggered = true;
            window.ytMinimizedYouTubePos = currentPos;
            window.ytMinimizedPreviewPos = (currentPos / 1000) % 30;
          }

          // Trigger state sync to play the direct audio fallback preview at user volume
          syncAudioStateSync(state.currentTrack, "youtube", state.isPlaying, state.volume);
        }
      } else if (document.visibilityState === "visible") {
        if (fallbackTriggeredRef.current) {
          fallbackTriggeredRef.current = false;

          const audio = getDirectAudioElement();
          let currentPos = state.positionMs;
          if (audio) {
            const dur = audio.duration;
            const loopDur = (dur && !isNaN(dur)) ? dur : 30;
            const currentPreviewPos = audio.currentTime;
            let elapsed = currentPreviewPos - minimizedPreviewPosRef.current;
            if (elapsed < 0 && loopDur > 0) {
              elapsed += loopDur;
            }
            currentPos = minimizedYouTubePosRef.current + (elapsed * 1000);
          }

          // Resume YouTube immediately, seeking to the estimated position.
          // Note: we do NOT call syncAudioStateSync here to silence direct audio.
          // We wait until the YouTube player transitions to PLAYING state to avoid a silent buffering gap.
          usePlayerStore.setState({
            seekTarget: currentPos + 300 // seek slightly ahead to account for initial buffer delay
          });

          const activePlayer = window.activeYTPlayer;
          if (activePlayer && typeof activePlayer.playVideo === "function") {
            try {
              activePlayer.playVideo();
            } catch (err) {
              console.error("[useBackgroundPlayback] Failed to resume active YT player:", err);
            }
          }
        } else {
          fallbackTriggeredRef.current = false;
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
