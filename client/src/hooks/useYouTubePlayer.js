import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    
    const existingScript = document.getElementById("youtube-api-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-api-script";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };
  });
}

export function useYouTubePlayer({ videoId, isPlaying }) {
  const containerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const seekTarget = usePlayerStore((state) => state.seekTarget);

  // Tracks whether a pause was requested while YouTube was still buffering.
  // pauseVideo() is silently ignored by the IFrame API during BUFFERING (state 3),
  // so we persist the intent here and honour it the moment PLAYING fires.
  const pendingPauseRef = useRef(false);

  // Create the player once
  useEffect(() => {
    let isMounted = true;
    let ytPlayer = null;

    if (!containerRef.current) return;
    const host = containerRef.current;
    const mount = document.createElement("div");
    host.replaceChildren(mount);
    
    loadYouTubeAPI().then(() => {
      if (!isMounted) return;
      
      ytPlayer = new window.YT.Player(mount, {
        videoId: videoId || "",
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            if (isMounted) {
              setPlayer(event.target);
              if (usePlayerStore.getState().isPlaying) {
                event.target.playVideo();
              } else {
                // Player may have auto-started via playerVars.autoplay=1 set at
                // mount time — make sure we honour whatever the store says now.
                pendingPauseRef.current = true;
              }
            }
          },
          onStateChange: (event) => {
            const { isPlaying: storeIsPlaying, next, pause } = usePlayerStore.getState();
            const YT = window.YT.PlayerState;

            if (event.data === YT.BUFFERING) {
              usePlayerStore.getState().setBuffering(true);
              // pauseVideo() is a no-op during buffering — record the intent instead.
              if (!storeIsPlaying) {
                pendingPauseRef.current = true;
              }
            }

            if (event.data === YT.PLAYING) {
              usePlayerStore.getState().setBuffering(false);
              // Populate available qualities once the video starts
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
              if (storeIsPlaying) {
                pause();
              }
            }

            if (event.data === YT.ENDED) {
              usePlayerStore.getState().setBuffering(false);
              pendingPauseRef.current = false;
              next();
            }
          }
        }
      });
    });
    
    return () => {
      isMounted = false;
      if (ytPlayer && typeof ytPlayer.destroy === "function") {
        ytPlayer.destroy();
      }
      host.textContent = "";
      setPlayer(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once to mount the iframe

  // Handle videoId change — cross-fade: fade out current, load new, fade in
  useEffect(() => {
    if (player && typeof player.loadVideoById === "function") {
      if (videoId) {
        // Cross-fade out
        const currentVol = typeof player.getVolume === "function" ? player.getVolume() : 100;
        const steps = 8;
        const stepMs = 100;
        let step = 0;

        const fadeOut = setInterval(() => {
          step++;
          if (typeof player.setVolume === "function") {
            player.setVolume(Math.max(0, currentVol * (1 - step / steps)));
          }
          if (step >= steps) {
            clearInterval(fadeOut);
            player.stopVideo();
            
            // If isPlaying is true, load and play; if false, just cue (load thumbnail/info)
            if (isPlaying) {
              player.loadVideoById(videoId);
            } else {
              player.cueVideoById(videoId);
            }

            // Fade back in
            let inStep = 0;
            const fadeIn = setInterval(() => {
              inStep++;
              if (typeof player.setVolume === "function") {
                player.setVolume(Math.min(currentVol, currentVol * (inStep / steps)));
              }
              if (inStep >= steps) clearInterval(fadeIn);
            }, stepMs);
          }
        }, stepMs);
      } else {
        player.stopVideo();
      }
    }
  }, [player, videoId]);

  // Handle isPlaying change
  useEffect(() => {
    if (player && typeof player.playVideo === "function") {
      if (isPlaying) {
        pendingPauseRef.current = false;
        player.playVideo();
      } else {
        // Always record the intent. If the player is in BUFFERING state,
        // pauseVideo() will be ignored by YouTube — pendingPauseRef ensures
        // we pause the moment PLAYING fires.
        pendingPauseRef.current = true;
        player.pauseVideo();
      }
    }
  }, [player, isPlaying]);

  // Handle seekTarget from store
  useEffect(() => {
    if (player && seekTarget !== null && typeof player.seekTo === "function") {
      player.seekTo(seekTarget / 1000, true);
      usePlayerStore.getState().setSeekTarget(null);
    }
  }, [player, seekTarget]);

  // Poll time updates
  useEffect(() => {
    if (!player || !isPlaying || !videoId) return;
    
    const interval = setInterval(() => {
      if (typeof player.getCurrentTime === "function") {
        const time = player.getCurrentTime() * 1000;
        const dur = player.getDuration() * 1000;
        if (time > 0) usePlayerStore.getState().setPosition(time);
        if (dur > 0) usePlayerStore.getState().setDuration(dur);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [player, isPlaying, videoId]);

  // Apply YouTube playback quality when player or quality setting changes
  const playbackQuality = useSettingsStore((state) => state.playbackQuality);
  useEffect(() => {
    if (player && typeof player.setPlaybackQuality === "function") {
      player.setPlaybackQuality(playbackQuality);
    }
  }, [player, playbackQuality]);

  return { containerRef };
}
