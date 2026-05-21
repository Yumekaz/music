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
  const keepaliveAudioRef = useRef(null);
  const keepaliveIntervalRef = useRef(null);
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

  // ── 3. Silent audio keepalive for YouTube source ──────────────
  // Chrome Android is much less aggressive about freezing tabs that have
  // an *actively playing* <audio> element. We generate a near-silent
  // WAV data URI and loop it while YouTube is the active source.
  useEffect(() => {
    const isYouTube = sourceType === "youtube";
    const shouldKeepAlive = isPlaying && currentTrack && isYouTube;

    if (!shouldKeepAlive) {
      if (keepaliveAudioRef.current) {
        keepaliveAudioRef.current.pause();
        keepaliveAudioRef.current.src = "";
        keepaliveAudioRef.current = null;
      }
      if (keepaliveIntervalRef.current) {
        clearInterval(keepaliveIntervalRef.current);
        keepaliveIntervalRef.current = null;
      }
      return;
    }

    // Only create if we don't already have one
    if (!keepaliveAudioRef.current) {
      try {
        // Generate a tiny 1-second silent WAV (44100 Hz, 16-bit, mono)
        const sampleRate = 44100;
        const numSamples = sampleRate; // 1 second
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, str) => {
          for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeString(0, "RIFF");
        view.setUint32(4, 36 + numSamples * 2, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // byte rate
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, "data");
        view.setUint32(40, numSamples * 2, true);

        // Write near-silent samples (value of 1 to avoid true silence detection)
        for (let i = 0; i < numSamples; i++) {
          view.setInt16(44 + i * 2, 1, true);
        }

        const blob = new Blob([buffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio();
        audio.src = url;
        audio.loop = true;
        audio.volume = 0.01; // Nearly inaudible
        audio.play().catch(() => {});

        keepaliveAudioRef.current = audio;
      } catch {
        // Can't create keepalive audio — not critical
      }
    }

    return () => {
      // Don't cleanup here — let the shouldKeepAlive === false branch handle it
    };
  }, [isPlaying, currentTrack, sourceType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (keepaliveAudioRef.current) {
        keepaliveAudioRef.current.pause();
        keepaliveAudioRef.current.src = "";
        keepaliveAudioRef.current = null;
      }
      if (keepaliveIntervalRef.current) {
        clearInterval(keepaliveIntervalRef.current);
        keepaliveIntervalRef.current = null;
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);
}
