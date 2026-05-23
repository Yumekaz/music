import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { audioSourceMatches, getDirectAudioElement, syncAudioStateSync, getDirectAudioSourceSync } from "../lib/directAudio.js";
import {
  CHROME_RESUME_SEEK_LEAD_MS,
  clampPlaybackPositionMs,
  clearChromeBackgroundHandoff,
  estimateChromeResumePositionMs,
  getChromeBackgroundHandoff,
  setChromeBackgroundHandoff,
  shouldUseChromeAndroidBackgroundFallback
} from "../lib/browserPlayback.js";
import {
  getChromeBackgroundAudioSourceType,
  getChromeForegroundOnlyReason,
  hasChromeBackgroundAudioSource
} from "../lib/chromeBackgroundAudio.js";

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
function getFiniteAudioDurationSeconds(audio, fallbackMs = 0) {
  const audioDuration = Number(audio?.duration);
  if (Number.isFinite(audioDuration) && audioDuration > 0) return audioDuration;
  const fallbackSeconds = Number(fallbackMs) / 1000;
  return Number.isFinite(fallbackSeconds) && fallbackSeconds > 0 ? fallbackSeconds : 0;
}

function clampAudioSeconds(seconds, durationSeconds = 0) {
  const position = Math.max(0, Number(seconds) || 0);
  if (!durationSeconds) return position;
  return Math.min(position, Math.max(0, durationSeconds - 1));
}

function buildPlaybackFailure(message, trackId, status = "foreground-only") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    trackId,
    status
  };
}

export function useBackgroundPlayback() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const sourceType = usePlayerStore((state) => state.sourceType);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const wakeLockRef = useRef(null);
  const fallbackTriggeredRef = useRef(false);
  const loadedMetadataListenerRef = useRef(null);

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
  // Automatically switch to full direct audio if Chrome is minimized on mobile,
  // and recover when returning to the tab.
  useEffect(() => {
    function handleVisibilityChange() {
      const settings = useSettingsStore.getState();
      const state = usePlayerStore.getState();
      const chromeFallbackEnabled = shouldUseChromeAndroidBackgroundFallback(settings);

      if (document.visibilityState === "hidden") {
        if (
          chromeFallbackEnabled &&
          state.isPlaying &&
          state.sourceType === "youtube" &&
          state.currentTrack
        ) {
          const backgroundSourceType = getChromeBackgroundAudioSourceType(state.currentTrack);
          const hasBackgroundAudio = hasChromeBackgroundAudioSource(state.currentTrack);
          fallbackTriggeredRef.current = true;
          const hiddenAtMs = Date.now();

          // Get the active YouTube player and pause it immediately to prevent double audio overlay.
          const activePlayer = window.activeYTPlayer;
          let currentPos = state.positionMs;

          if (activePlayer && typeof activePlayer.getCurrentTime === "function") {
            try {
              const ytTime = activePlayer.getCurrentTime();
              if (typeof ytTime === "number" && !isNaN(ytTime)) {
                const ytTimeMs = ytTime * 1000;
                // Only trust the YouTube player's time if it's positive and reasonably close to our last polled position.
                // If it returns 0 or has a massive desync, Chrome Android has likely already frozen the iframe's context.
                if (ytTimeMs > 0 && (state.positionMs < 2000 || Math.abs(ytTimeMs - state.positionMs) < 5000)) {
                  currentPos = ytTimeMs;
                } else {
                  console.warn(`[useBackgroundPlayback] Ignoring suspicious YT player time: ${ytTimeMs}ms (last polled: ${state.positionMs}ms)`);
                }
              }
              activePlayer.pauseVideo();
            } catch (err) {
              console.error("[useBackgroundPlayback] Failed to pause active YT player:", err);
            }
          }

          if (!hasBackgroundAudio) {
            fallbackTriggeredRef.current = false;
            clearChromeBackgroundHandoff();
            const audio = getDirectAudioElement();
            audio?.pause();
            syncAudioStateSync(state.currentTrack, "youtube", false, state.volume);
            usePlayerStore.setState({
              isPlaying: false,
              isBuffering: false,
              playbackFailure: buildPlaybackFailure(
                getChromeForegroundOnlyReason(state.currentTrack),
                state.currentTrack.id
              )
            });
            window.ytBackgroundFallbackTriggered = false;
            window.ytMinimizedYouTubePos = currentPos;
            window.ytMinimizedPreviewPos = 0;
            window.ytMinimizedTime = hiddenAtMs;
            return;
          }

          const audio = getDirectAudioElement();
          const fallbackSession = {
            id: `${state.currentTrack.id}-${hiddenAtMs}`,
            trackId: state.currentTrack.id,
            videoId: state.currentTrack.videoId || "",
            sourceType: backgroundSourceType,
            anchorPositionMs: currentPos,
            anchorPreviewSeconds: 0,
            loopDurationSeconds: 0,
            hiddenAtMs,
            durationMs: state.durationMs || state.currentTrack.durationMs || 0,
            returnTargetMs: null
          };

          if (audio) {
            // Clean up any existing loadedmetadata listener
            if (loadedMetadataListenerRef.current) {
              try {
                audio.removeEventListener("loadedmetadata", loadedMetadataListenerRef.current);
              } catch (err) {}
              loadedMetadataListenerRef.current = null;
            }

            audio.loop = false;
            const targetSrc = getDirectAudioSourceSync(state.currentTrack, backgroundSourceType);

            const applySeek = () => {
              try {
                const durationSeconds = getFiniteAudioDurationSeconds(audio, fallbackSession.durationMs);
                const startPos = clampAudioSeconds(currentPos / 1000, durationSeconds);

                audio.currentTime = startPos;
                fallbackSession.anchorPreviewSeconds = startPos;
                fallbackSession.loopDurationSeconds = durationSeconds;
                setChromeBackgroundHandoff(fallbackSession);

                window.ytBackgroundFallbackTriggered = true;
                window.ytMinimizedYouTubePos = currentPos;
                window.ytMinimizedPreviewPos = startPos;
                window.ytMinimizedTime = hiddenAtMs;
                console.log(`[useBackgroundPlayback] Background audio seeked to ${startPos}s (duration: ${durationSeconds || "unknown"}s)`);
              } catch (err) {
                console.error("[useBackgroundPlayback] Failed to seek fallback audio on load:", err);
              }
            };

            // Chrome Android can stall background range requests if we seek right as the tab is hidden.
            // If the same full source is already loaded, prefer its current position and avoid a fresh seek.
            if (audioSourceMatches(audio, targetSrc) && audio.readyState >= 1) {
              const durationSeconds = getFiniteAudioDurationSeconds(audio, fallbackSession.durationMs);
              fallbackSession.anchorPreviewSeconds = clampAudioSeconds(audio.currentTime, durationSeconds);
              fallbackSession.loopDurationSeconds = durationSeconds;
              setChromeBackgroundHandoff(fallbackSession);

              window.ytBackgroundFallbackTriggered = true;
              window.ytMinimizedYouTubePos = currentPos;
              window.ytMinimizedPreviewPos = fallbackSession.anchorPreviewSeconds;
              window.ytMinimizedTime = hiddenAtMs;
              console.log(`[useBackgroundPlayback] Background fallback: using loaded audio.currentTime = ${fallbackSession.anchorPreviewSeconds}s`);
            } else {
              loadedMetadataListenerRef.current = applySeek;
              audio.addEventListener("loadedmetadata", applySeek, { once: true });

              // Optimistic values in case we return before loadedmetadata fires.
              const durationSeconds = (fallbackSession.durationMs || 0) / 1000;
              const startPos = clampAudioSeconds(currentPos / 1000, durationSeconds);
              fallbackSession.anchorPreviewSeconds = startPos;
              fallbackSession.loopDurationSeconds = durationSeconds;
              setChromeBackgroundHandoff(fallbackSession);

              window.ytBackgroundFallbackTriggered = true;
              window.ytMinimizedYouTubePos = currentPos;
              window.ytMinimizedPreviewPos = startPos;
              window.ytMinimizedTime = hiddenAtMs;
            }
          } else {
            const durationSeconds = (fallbackSession.durationMs || 0) / 1000;
            fallbackSession.anchorPreviewSeconds = clampAudioSeconds(currentPos / 1000, durationSeconds);
            fallbackSession.loopDurationSeconds = durationSeconds;
            setChromeBackgroundHandoff(fallbackSession);

            window.ytBackgroundFallbackTriggered = true;
            window.ytMinimizedYouTubePos = currentPos;
            window.ytMinimizedPreviewPos = fallbackSession.anchorPreviewSeconds;
            window.ytMinimizedTime = hiddenAtMs;
          }

          // Trigger state sync to play the direct full audio fallback at user volume.
          syncAudioStateSync(state.currentTrack, "youtube", state.isPlaying, state.volume);
        }
      } else if (document.visibilityState === "visible") {
        const fallbackSession = getChromeBackgroundHandoff();

        if (fallbackTriggeredRef.current || fallbackSession) {
          fallbackTriggeredRef.current = false;

          const audio = getDirectAudioElement();
          if (audio && loadedMetadataListenerRef.current) {
            try {
              audio.removeEventListener("loadedmetadata", loadedMetadataListenerRef.current);
            } catch (err) {}
            loadedMetadataListenerRef.current = null;
          }

          let currentPos = state.positionMs;
          if (fallbackSession) {
            const dur = audio?.duration;
            const directSeconds = Number(audio?.currentTime);
            const wallClockPos = estimateChromeResumePositionMs(fallbackSession, {
              leadMs: CHROME_RESUME_SEEK_LEAD_MS
            });

            if (fallbackSession.sourceType === "jamendo" && Number.isFinite(directSeconds)) {
              currentPos = clampPlaybackPositionMs(
                Math.max(wallClockPos, (directSeconds * 1000) + CHROME_RESUME_SEEK_LEAD_MS),
                fallbackSession.durationMs
              );
            } else {
              const loopDur = (dur && !isNaN(dur)) ? dur : 30;
              currentPos = estimateChromeResumePositionMs(fallbackSession, {
                currentPreviewSeconds: audio?.currentTime,
                loopDurationSeconds: loopDur,
                leadMs: CHROME_RESUME_SEEK_LEAD_MS
              });
            }
            fallbackSession.returnTargetMs = currentPos;
            fallbackSession.returnStartedAtMs = Date.now();
            setChromeBackgroundHandoff(fallbackSession);
          }

          // Resume YouTube immediately, seeking to the wall-clock target.
          // Note: we do NOT call syncAudioStateSync here to silence direct audio.
          // We wait until the YouTube player transitions to PLAYING state to avoid a silent buffering gap.
          usePlayerStore.setState({
            seekTarget: currentPos
          });

          const activePlayer = window.activeYTPlayer;
          if (activePlayer) {
            try {
              if (typeof activePlayer.seekTo === "function") {
                activePlayer.seekTo(currentPos / 1000, true);
              }
              if (typeof activePlayer.playVideo === "function") {
                activePlayer.playVideo();
              }
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

  // ── 3. Foreground sync loop ───────────────────────────────────
  // Keeps a loaded full background source aligned when it is already active.
  // Chrome preview URLs are intentionally excluded; 30-second clips must never
  // masquerade as background playback.
  useEffect(() => {
    if (document.visibilityState !== "visible") return;
    if (!isPlaying || sourceType !== "youtube" || !currentTrack) return;
    if (!shouldUseChromeAndroidBackgroundFallback(useSettingsStore.getState())) return;
    if (!hasChromeBackgroundAudioSource(currentTrack)) return;

    const audio = getDirectAudioElement();
    if (!audio) return;
    const backgroundSourceType = getChromeBackgroundAudioSourceType(currentTrack);
    const targetSrc = getDirectAudioSourceSync(currentTrack, backgroundSourceType);
    if (!audioSourceMatches(audio, targetSrc)) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (!audioSourceMatches(audio, targetSrc)) return;

      const durationSeconds = getFiniteAudioDurationSeconds(audio, currentTrack.durationMs);
      const expectedAudioPos = clampAudioSeconds(
        usePlayerStore.getState().positionMs / 1000,
        durationSeconds
      );

      if (audio.readyState < 1) return;

      const drift = Math.abs(audio.currentTime - expectedAudioPos);
      if (drift > 0.35) {
        console.log(`[useBackgroundPlayback] Drift detected: ${drift.toFixed(2)}s. Syncing background audio currentTime to ${expectedAudioPos.toFixed(2)}s`);
        audio.currentTime = expectedAudioPos;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, sourceType, currentTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      const audio = getDirectAudioElement();
      if (audio && loadedMetadataListenerRef.current) {
        try {
          audio.removeEventListener("loadedmetadata", loadedMetadataListenerRef.current);
        } catch (err) {}
        loadedMetadataListenerRef.current = null;
      }
    };
  }, []);
}
