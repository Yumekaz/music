import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { getDirectAudioElement, syncAudioStateSync } from "../lib/directAudio.js";
import {
  CHROME_HANDOFF_SETTLE_MS,
  clearChromeBackgroundHandoff,
  estimateChromeResumePositionMs,
  getChromeBackgroundHandoff,
  isOfficialChromeAndroid
} from "../lib/browserPlayback.js";

function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    
    const existingScript = document.getElementById("youtube-api-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => reject(new Error("Unable to load YouTube iframe API"));
      document.head.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };
  });
}

function createPlayerOptions(isPlaying, initialVideoId) {
  const opts = {
    playerVars: {
      autoplay: isPlaying ? 1 : 0,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      playsinline: 1,
      origin: window.location.origin
    }
  };
  if (initialVideoId) {
    opts.videoId = initialVideoId;
  }
  return opts;
}

function callPlayer(player, method, ...args) {
  if (!player || typeof player[method] !== "function") return false;

  try {
    player[method](...args);
    return true;
  } catch {
    return false;
  }
}

export function useYouTubePlayer({ videoId, nextVideoId, isPlaying }) {
  const containerARef = useRef(null);
  const containerBRef = useRef(null);
  
  const [playerA, setPlayerA] = useState(null);
  const [playerB, setPlayerB] = useState(null);
  
  const [activePlayerId, setActivePlayerId] = useState('A');
  const activePlayerRef = useRef('A'); 

  // Track what video is loaded in each player to avoid flaky getVideoData() calls
  const playerAVideoIdRef = useRef(videoId || "");
  const playerBVideoIdRef = useRef("");

  const seekTarget = usePlayerStore((state) => state.seekTarget);
  const volume = usePlayerStore((state) => state.volume);
  const pendingPauseRef = useRef(false);
  const pendingStartRef = useRef(null);
  const pendingStartTimeoutRef = useRef(null);
  const sponsorSegmentsRef = useRef([]);

  const activePlayer = activePlayerId === 'A' ? playerA : playerB;

  function clearPendingStart(playerId, videoId) {
    const pendingStart = pendingStartRef.current;
    if (!pendingStart) return;
    if (playerId && pendingStart.playerId !== playerId) return;
    if (videoId && pendingStart.videoId !== videoId) return;

    pendingStartRef.current = null;
    if (pendingStartTimeoutRef.current) {
      window.clearTimeout(pendingStartTimeoutRef.current);
      pendingStartTimeoutRef.current = null;
    }
  }

  function markPendingStart(playerId, videoId) {
    pendingStartRef.current = { playerId, videoId };
    pendingPauseRef.current = false;
    usePlayerStore.getState().setBuffering(true);
  }

  function armPendingStartRetry(player, playerId, videoId) {
    if (pendingStartTimeoutRef.current) {
      window.clearTimeout(pendingStartTimeoutRef.current);
      pendingStartTimeoutRef.current = null;
    }

    pendingStartTimeoutRef.current = window.setTimeout(() => {
      const state = usePlayerStore.getState();
      const stillCurrent =
        state.isPlaying &&
        state.sourceType === "youtube" &&
        state.currentTrack?.videoId === videoId &&
        pendingStartRef.current?.playerId === playerId &&
        pendingStartRef.current?.videoId === videoId;

      if (!stillCurrent || !player) return;

      try {
        const ytState = typeof player.getPlayerState === "function"
          ? player.getPlayerState()
          : null;
        const YT = window.YT?.PlayerState || {};

        if (ytState === YT.PLAYING) {
          clearPendingStart(playerId, videoId);
          usePlayerStore.getState().setBuffering(false);
          return;
        }
      } catch {
        // Fall through and ask the iframe to start again.
      }

      callPlayer(player, "playVideo");
    }, 700);
  }

  function startPendingPlayer(player, playerId, videoId) {
    markPendingStart(playerId, videoId);
    armPendingStartRetry(player, playerId, videoId);

    if (!callPlayer(player, "loadVideoById", videoId)) {
      callPlayer(player, "playVideo");
    }
  }

  // 1. Initialize both players
  useEffect(() => {
    let isMounted = true;
    let ytPlayerA = null;
    let ytPlayerB = null;

    if (!containerARef.current || !containerBRef.current) return;

    loadYouTubeAPI().then(() => {
      if (!isMounted) return;

      const optsA = createPlayerOptions(isPlaying, videoId);
      const optsB = createPlayerOptions(false, "");
      
      const onStateChange = (event) => {
        // Only react to events from the currently active player
        const isFromActive = event.target === (activePlayerRef.current === 'A' ? ytPlayerA : ytPlayerB);
        if (!isFromActive) return;

        const state = usePlayerStore.getState();
        const { isPlaying: storeIsPlaying, next, pause } = state;
        const YT = window.YT.PlayerState;
        const eventPlayerId = event.target === ytPlayerA ? 'A' : 'B';
        const eventVideoId = eventPlayerId === 'A'
          ? playerAVideoIdRef.current
          : playerBVideoIdRef.current;
        const currentVideoId = state.currentTrack?.videoId || "";

        if (currentVideoId && eventVideoId && eventVideoId !== currentVideoId) {
          return;
        }

        if (event.data === YT.BUFFERING) {
          usePlayerStore.getState().setBuffering(true);
          if (!storeIsPlaying) pendingPauseRef.current = true;
        }

        if (event.data === YT.PLAYING) {
          clearPendingStart(eventPlayerId, eventVideoId);
          usePlayerStore.getState().setBuffering(false);
          try {
            const qualities = event.target.getAvailableQualityLevels?.() || [];
            if (qualities.length) {
              useSettingsStore.getState().setYoutubeAvailableQualities(qualities);
            }
          } catch { /* ignore */ }

          // Transition back from Chrome Android background fallback.
          const canFinishChromeHandoff = document.visibilityState === "visible";
          const chromeHandoff = canFinishChromeHandoff ? getChromeBackgroundHandoff() : null;
          if (canFinishChromeHandoff && (chromeHandoff || window.ytBackgroundFallbackTriggered)) {
            window.ytBackgroundFallbackTriggered = false;

            const audio = getDirectAudioElement();
            if (audio && chromeHandoff) {
              const currentPreviewPos = audio.currentTime;
              const dur = audio.duration;
              const loopDur = (dur && !isNaN(dur)) ? dur : 30;

              const expectedPos = estimateChromeResumePositionMs(chromeHandoff, {
                  currentPreviewSeconds: currentPreviewPos,
                  loopDurationSeconds: loopDur
              });

              try {
                const ytTimeMs = event.target.getCurrentTime() * 1000;
                const diff = Math.abs(ytTimeMs - expectedPos);
                console.log(`[useYouTubePlayer] Returning from background fallback. YT time: ${ytTimeMs}ms, Expected: ${expectedPos}ms, Diff: ${diff}ms`);

                if (diff > 500) {
                  event.target.seekTo(expectedPos / 1000, true);
                }
                usePlayerStore.getState().setPosition(expectedPos);
              } catch (err) {
                console.error("[useYouTubePlayer] Failed to query/seek YT player on return:", err);
              }
            }

            window.ytMinimizedTime = 0;

            const handoffId = chromeHandoff?.id;
            window.setTimeout(() => {
              const state = usePlayerStore.getState();
              syncAudioStateSync(state.currentTrack, "youtube", state.isPlaying, state.volume);
              clearChromeBackgroundHandoff(handoffId);
            }, CHROME_HANDOFF_SETTLE_MS);
          }

          if (pendingPauseRef.current || !storeIsPlaying) {
            pendingPauseRef.current = false;
            setTimeout(() => callPlayer(event.target, "pauseVideo"), 0);
          }
        }

        if (event.data === YT.PAUSED) {
          const pendingStart = pendingStartRef.current;
          if (
            storeIsPlaying &&
            pendingStart?.playerId === eventPlayerId &&
            pendingStart.videoId === eventVideoId
          ) {
            usePlayerStore.getState().setBuffering(true);
            return;
          }

          usePlayerStore.getState().setBuffering(false);
          pendingPauseRef.current = false;

          const settings = useSettingsStore.getState();

          if (isOfficialChromeAndroid() && settings?.mobileBackgroundFallback && getChromeBackgroundHandoff()) {
            console.log("[useYouTubePlayer] Ignoring YT.PAUSED because mobileBackgroundFallback is active.");
            return;
          }

          if (usePlayerStore.getState().sourceType !== "youtube") return;
          if (storeIsPlaying) pause();
        }

        if (event.data === YT.ENDED) {
          clearPendingStart(eventPlayerId, eventVideoId);
          usePlayerStore.getState().setBuffering(false);
          pendingPauseRef.current = false;
          next();
        }
      };

      const onError = (event) => {
        const isFromActive = event.target === (activePlayerRef.current === 'A' ? ytPlayerA : ytPlayerB);
        if (!isFromActive) return;
        const eventPlayerId = event.target === ytPlayerA ? 'A' : 'B';
        const eventVideoId = eventPlayerId === 'A'
          ? playerAVideoIdRef.current
          : playerBVideoIdRef.current;
        clearPendingStart(eventPlayerId, eventVideoId);
        usePlayerStore.getState().setBuffering(false);
        pendingPauseRef.current = false;
        usePlayerStore.getState().pause();
      };

      const mountA = document.createElement("div");
      containerARef.current.replaceChildren(mountA);
      
      const mountB = document.createElement("div");
      containerBRef.current.replaceChildren(mountB);

      ytPlayerA = new window.YT.Player(mountA, {
        ...optsA,
        events: {
          onReady: (e) => { if (isMounted) setPlayerA(e.target); },
          onStateChange,
          onError
        }
      });

      ytPlayerB = new window.YT.Player(mountB, {
        ...optsB,
        events: {
          onReady: (e) => { if (isMounted) setPlayerB(e.target); },
          onStateChange,
          onError
        }
      });

    }).catch(() => {
      // Error loading API
    });
    
    return () => {
      isMounted = false;
      clearPendingStart();
      callPlayer(ytPlayerA, "destroy");
      callPlayer(ytPlayerB, "destroy");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 2. Handle videoId change (Active Player Transitions)
  useEffect(() => {
    if (!playerA || !playerB) return;

    const currentActiveId = activePlayerRef.current;
    const currentActive = currentActiveId === 'A' ? playerA : playerB;
    const currentStandby = currentActiveId === 'A' ? playerB : playerA;

    const activeVideoId = currentActiveId === 'A' ? playerAVideoIdRef.current : playerBVideoIdRef.current;
    const standbyVideoId = currentActiveId === 'A' ? playerBVideoIdRef.current : playerAVideoIdRef.current;

    if (!videoId) {
      callPlayer(currentActive, "stopVideo");
      if (currentActiveId === 'A') playerAVideoIdRef.current = "";
      else playerBVideoIdRef.current = "";
      return;
    }

    if (activeVideoId === videoId) {
      // Already active
      return;
    }

    if (standbyVideoId === videoId) {
      // Pre-buffered! Swap them.
      const newActiveId = currentActiveId === 'A' ? 'B' : 'A';
      activePlayerRef.current = newActiveId;
      setActivePlayerId(newActiveId);

      // Mark the standby player active before stopping the old iframe so any
      // pause/stop event from the old video cannot flip the app back to paused.
      callPlayer(currentActive, "stopVideo");

      if (isPlaying) {
        markPendingStart(newActiveId, videoId);
      }
      return;
    }

    // Neither player has it (e.g. user clicked a random song). Load into active directly.
    if (currentActiveId === 'A') playerAVideoIdRef.current = videoId;
    else playerBVideoIdRef.current = videoId;

    if (isPlaying) {
      startPendingPlayer(currentActive, currentActiveId, videoId);
    } else {
      callPlayer(currentActive, "cueVideoById", videoId);
    }

  // Intentionally omitting activePlayerId to avoid double-firing during a swap, but using refs for logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerA, playerB, isPlaying]); // Added isPlaying to deps so it can trigger load vs cue properly

  // 3. Pre-buffer nextVideoId
  useEffect(() => {
    if (!playerA || !playerB || !nextVideoId) return;

    const currentActiveId = activePlayerRef.current;
    const currentStandby = currentActiveId === 'A' ? playerB : playerA;
    const standbyVideoId = currentActiveId === 'A' ? playerBVideoIdRef.current : playerAVideoIdRef.current;
    
    if (standbyVideoId !== nextVideoId) {
      if (currentActiveId === 'A') playerBVideoIdRef.current = nextVideoId;
      else playerAVideoIdRef.current = nextVideoId;
      
      callPlayer(currentStandby, "cueVideoById", nextVideoId);
    }
  }, [nextVideoId, playerA, playerB, activePlayerId]);

  // 4. Start a selected standby player only after React promotes it to active.
  useEffect(() => {
    const pendingStart = pendingStartRef.current;
    if (!pendingStart || !isPlaying || pendingStart.videoId !== videoId) return;
    if (pendingStart.playerId !== activePlayerId) return;

    const currentActive = activePlayerId === 'A' ? playerA : playerB;
    if (!currentActive) return;

    startPendingPlayer(currentActive, activePlayerId, videoId);
  }, [activePlayerId, videoId, isPlaying, playerA, playerB]);

  // 5. Handle Play/Pause
  useEffect(() => {
    const currentActive = activePlayerRef.current === 'A' ? playerA : playerB;
    const activeVideoId = activePlayerRef.current === 'A'
      ? playerAVideoIdRef.current
      : playerBVideoIdRef.current;

    if (!currentActive || activeVideoId !== videoId) return;

    if (isPlaying && videoId) {
      const pendingStart = pendingStartRef.current;
      if (
        pendingStart?.videoId === videoId &&
        pendingStart.playerId === activePlayerRef.current
      ) {
        return;
      }

      pendingPauseRef.current = false;
      callPlayer(currentActive, "playVideo");
    } else {
      pendingPauseRef.current = true;
      callPlayer(currentActive, "pauseVideo");
    }
  }, [activePlayerId, playerA, playerB, isPlaying, videoId]);

  // 6. Handle Seek
  useEffect(() => {
    if (activePlayer && seekTarget !== null) {
      callPlayer(activePlayer, "seekTo", seekTarget / 1000, true);
      usePlayerStore.getState().setSeekTarget(null);
    }
  }, [activePlayer, seekTarget]);

  // 7. Time Polling & SponsorBlock
  useEffect(() => {
    if (!activePlayer || !isPlaying || !videoId) return;
    
    const interval = setInterval(() => {
      try {
        if (typeof activePlayer.getCurrentTime !== "function") return;
        const timeSec = activePlayer.getCurrentTime();
        const timeMs = timeSec * 1000;
        const durMs = activePlayer.getDuration() * 1000;
        
        const segments = sponsorSegmentsRef.current;
        if (segments && segments.length > 0) {
          for (const seg of segments) {
            if (timeSec >= seg.segment[0] && timeSec < seg.segment[1]) {
              activePlayer.seekTo(seg.segment[1], true);
              return;
            }
          }
        }

        if (timeMs > 0) usePlayerStore.getState().setPosition(timeMs);
        if (durMs > 0) usePlayerStore.getState().setDuration(durMs);
      } catch {
        // The YouTube iframe can briefly disappear during mobile tab lifecycle changes.
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [activePlayer, isPlaying, videoId]);

  // 8. Fetch SponsorBlock
  useEffect(() => {
    if (!videoId) {
      sponsorSegmentsRef.current = [];
      return;
    }
    let isMounted = true;
    sponsorSegmentsRef.current = [];

    const fetchSponsorBlock = async () => {
      try {
        const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["music_offtopic"]`;
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && Array.isArray(data)) {
          sponsorSegmentsRef.current = data;
        }
      } catch (err) {}
    };

    fetchSponsorBlock();
    return () => { isMounted = false; };
  }, [videoId]);

  // 9. Quality Settings
  const playbackQuality = useSettingsStore((state) => state.playbackQuality);
  useEffect(() => {
    callPlayer(activePlayer, "setPlaybackQuality", playbackQuality);
  }, [activePlayer, playbackQuality]);

  // 10. Volume Synchronization
  useEffect(() => {
    callPlayer(playerA, "setVolume", volume * 100);
  }, [playerA, volume]);

  useEffect(() => {
    callPlayer(playerB, "setVolume", volume * 100);
  }, [playerB, volume]);

  // 11. Visibility change recovery — resume YouTube after Chrome unfreezes tab
  useEffect(() => {
    function handleVisibilityResume() {
      if (document.visibilityState !== "visible") return;

      const state = usePlayerStore.getState();
      if (!state.isPlaying || state.sourceType !== "youtube") return;

      const currentActive = activePlayerRef.current === 'A' ? playerA : playerB;
      if (!currentActive || typeof currentActive.getPlayerState !== "function") return;

      try {
        const ytState = currentActive.getPlayerState();
        // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
        if (ytState === 2 || ytState === -1 || ytState === 5) {
          // YouTube was paused/frozen by Chrome — resume it
          callPlayer(currentActive, "playVideo");
        }
      } catch {
        // Player might be destroyed or in a bad state after freeze
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityResume);
    return () => document.removeEventListener("visibilitychange", handleVisibilityResume);
  }, [playerA, playerB]);

  // Expose activePlayer globally for background playback transition handling
  useEffect(() => {
    window.activeYTPlayer = activePlayer;
    return () => {
      if (window.activeYTPlayer === activePlayer) {
        window.activeYTPlayer = null;
      }
    };
  }, [activePlayer]);

  return { containerARef, containerBRef, activePlayer: activePlayerId };
}
