import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";

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
  const sponsorSegmentsRef = useRef([]);

  const activePlayer = activePlayerId === 'A' ? playerA : playerB;

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

        const { isPlaying: storeIsPlaying, next, pause } = usePlayerStore.getState();
        const YT = window.YT.PlayerState;

        if (event.data === YT.BUFFERING) {
          usePlayerStore.getState().setBuffering(true);
          if (!storeIsPlaying) pendingPauseRef.current = true;
        }

        if (event.data === YT.PLAYING) {
          usePlayerStore.getState().setBuffering(false);
          try {
            const qualities = event.target.getAvailableQualityLevels?.() || [];
            if (qualities.length) {
              useSettingsStore.getState().setYoutubeAvailableQualities(qualities);
            }
          } catch { /* ignore */ }

          if (pendingPauseRef.current || !storeIsPlaying) {
            pendingPauseRef.current = false;
            setTimeout(() => event.target.pauseVideo(), 0);
          }
        }

        if (event.data === YT.PAUSED) {
          usePlayerStore.getState().setBuffering(false);
          pendingPauseRef.current = false;
          if (storeIsPlaying) pause();
        }

        if (event.data === YT.ENDED) {
          usePlayerStore.getState().setBuffering(false);
          pendingPauseRef.current = false;
          next();
        }
      };

      const onError = (event) => {
        const isFromActive = event.target === (activePlayerRef.current === 'A' ? ytPlayerA : ytPlayerB);
        if (!isFromActive) return;
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
      if (ytPlayerA?.destroy) ytPlayerA.destroy();
      if (ytPlayerB?.destroy) ytPlayerB.destroy();
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
      if (typeof currentActive.stopVideo === 'function') currentActive.stopVideo();
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
      if (typeof currentActive.stopVideo === 'function') currentActive.stopVideo();
      
      const newActiveId = currentActiveId === 'A' ? 'B' : 'A';
      activePlayerRef.current = newActiveId;
      setActivePlayerId(newActiveId);

      if (isPlaying && typeof currentStandby.playVideo === 'function') {
        currentStandby.playVideo();
      }
      return;
    }

    // Neither player has it (e.g. user clicked a random song). Load into active directly.
    if (currentActiveId === 'A') playerAVideoIdRef.current = videoId;
    else playerBVideoIdRef.current = videoId;

    if (isPlaying && typeof currentActive.loadVideoById === 'function') {
      currentActive.loadVideoById(videoId);
    } else if (typeof currentActive.cueVideoById === 'function') {
      currentActive.cueVideoById(videoId);
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
    
    if (standbyVideoId !== nextVideoId && typeof currentStandby.cueVideoById === 'function') {
      if (currentActiveId === 'A') playerBVideoIdRef.current = nextVideoId;
      else playerAVideoIdRef.current = nextVideoId;
      
      currentStandby.cueVideoById(nextVideoId);
    }
  }, [nextVideoId, playerA, playerB, activePlayerId]);

  // 4. Handle Play/Pause
  useEffect(() => {
    if (activePlayer && typeof activePlayer.playVideo === "function") {
      if (isPlaying && videoId) {
        pendingPauseRef.current = false;
        activePlayer.playVideo();
      } else {
        pendingPauseRef.current = true;
        activePlayer.pauseVideo();
      }
    }
  }, [activePlayer, isPlaying, videoId]);

  // 5. Handle Seek
  useEffect(() => {
    if (activePlayer && seekTarget !== null && typeof activePlayer.seekTo === "function") {
      activePlayer.seekTo(seekTarget / 1000, true);
      usePlayerStore.getState().setSeekTarget(null);
    }
  }, [activePlayer, seekTarget]);

  // 6. Time Polling & SponsorBlock
  useEffect(() => {
    if (!activePlayer || !isPlaying || !videoId) return;
    
    const interval = setInterval(() => {
      if (typeof activePlayer.getCurrentTime === "function") {
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
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [activePlayer, isPlaying, videoId]);

  // 7. Fetch SponsorBlock
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

  // 8. Quality Settings
  const playbackQuality = useSettingsStore((state) => state.playbackQuality);
  useEffect(() => {
    if (activePlayer && typeof activePlayer.setPlaybackQuality === "function") {
      activePlayer.setPlaybackQuality(playbackQuality);
    }
  }, [activePlayer, playbackQuality]);

  // 9. Volume Synchronization
  useEffect(() => {
    if (playerA && typeof playerA.setVolume === "function") {
      playerA.setVolume(volume * 100);
    }
  }, [playerA, volume]);

  useEffect(() => {
    if (playerB && typeof playerB.setVolume === "function") {
      playerB.setVolume(volume * 100);
    }
  }, [playerB, volume]);

  // 10. Visibility change recovery — resume YouTube after Chrome unfreezes tab
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
          currentActive.playVideo();
        }
      } catch {
        // Player might be destroyed or in a bad state after freeze
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityResume);
    return () => document.removeEventListener("visibilitychange", handleVisibilityResume);
  }, [playerA, playerB]);

  return { containerARef, containerBRef, activePlayer: activePlayerId };
}
