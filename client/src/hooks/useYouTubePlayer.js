import { useEffect, useMemo, useRef } from "react";

export function useYouTubePlayer({ videoId, isPlaying }) {
  const iframeRef = useRef(null);

  const src = useMemo(() => {
    if (!videoId) return "";
    const params = new URLSearchParams({
      autoplay: isPlaying ? "1" : "0",
      controls: "1",
      disablekb: "1",
      enablejsapi: "1",
      fs: "0",
      modestbranding: "1",
      rel: "0",
      iv_load_policy: "3",
      playsinline: "1",
      origin: window.location.origin
    });
    return `https://www.youtube.com/embed/${videoId}?${params}`;
  }, [videoId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const command = isPlaying ? "playVideo" : "pauseVideo";
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "https://www.youtube.com"
    );
  }, [isPlaying, videoId]);

  return { iframeRef, src };
}
