import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore.js";

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

  useEffect(() => {
    let isMounted = true;
    let ytPlayer = null;

    if (!containerRef.current) return;
    
    loadYouTubeAPI().then(() => {
      if (!isMounted || !containerRef.current) return;
      
      ytPlayer = new window.YT.Player(containerRef.current, {
        videoId: videoId || "",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            if (isMounted) {
              setPlayer(event.target);
              if (usePlayerStore.getState().isPlaying) {
                event.target.playVideo();
              }
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              usePlayerStore.getState().next();
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
      setPlayer(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once to mount the iframe

  // Handle videoId change
  useEffect(() => {
    if (player && typeof player.loadVideoById === "function") {
      if (videoId) {
        player.loadVideoById(videoId);
        if (!isPlaying) player.pauseVideo();
      } else {
        player.stopVideo();
      }
    }
  }, [player, videoId]);

  // Handle isPlaying change
  useEffect(() => {
    if (player && typeof player.playVideo === "function") {
      if (isPlaying) {
        player.playVideo();
      } else {
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
    if (!player || !isPlaying) return;
    
    const interval = setInterval(() => {
      if (typeof player.getCurrentTime === "function") {
        const time = player.getCurrentTime() * 1000;
        const dur = player.getDuration() * 1000;
        if (time > 0) usePlayerStore.getState().setPosition(time);
        if (dur > 0) usePlayerStore.getState().setDuration(dur);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  return { containerRef };
}
