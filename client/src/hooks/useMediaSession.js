import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore.js";

export function useMediaSession() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const seek = usePlayerStore((state) => state.seek);
  const setSeekTarget = usePlayerStore((state) => state.setSeekTarget);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const durationMs = usePlayerStore((state) => state.durationMs);

  // Update Media Session Metadata
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;

    const artistName = currentTrack.artistName || currentTrack.artist || "Unknown Artist";
    const albumName = currentTrack.albumName || currentTrack.album || "Unknown Album";

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentTrack.title,
      artist: artistName,
      album: albumName,
      artwork: currentTrack.artworkUrl
        ? [
            { src: currentTrack.artworkUrl, sizes: "96x96", type: "image/jpeg" },
            { src: currentTrack.artworkUrl, sizes: "128x128", type: "image/jpeg" },
            { src: currentTrack.artworkUrl, sizes: "192x192", type: "image/jpeg" },
            { src: currentTrack.artworkUrl, sizes: "256x256", type: "image/jpeg" },
            { src: currentTrack.artworkUrl, sizes: "384x384", type: "image/jpeg" },
            { src: currentTrack.artworkUrl, sizes: "512x512", type: "image/jpeg" }
          ]
        : []
    });

    navigator.mediaSession.setActionHandler("play", resume);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", previous);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    
    // Support seeking if possible
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in HTMLMediaElement.prototype) {
        // Fast seek not explicitly supported by our stores without a media element,
        // but we can just use setSeekTarget for standard seeking
      }
      if (details.seekTime !== undefined) {
        const timeMs = details.seekTime * 1000;
        setSeekTarget(timeMs);
        seek(timeMs);
      }
    });

    return () => {
      // Clean up action handlers when unmounting or track changes
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [currentTrack, resume, pause, next, previous, seek, setSeekTarget]);

  // Sync playback state
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying, currentTrack]);

  // Sync position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
    if (!currentTrack || !isPlaying) return;

    if (
      Number.isFinite(durationMs) &&
      durationMs > 0 &&
      Number.isFinite(positionMs) &&
      positionMs >= 0
    ) {
      try {
        const safePosition = Math.max(0, Math.min(positionMs / 1000, durationMs / 1000));
        navigator.mediaSession.setPositionState({
          duration: durationMs / 1000,
          playbackRate: 1.0,
          position: safePosition
        });
      } catch (err) {
        console.error("Error setting media session position state:", err);
      }
    }
  }, [isPlaying, currentTrack, positionMs, durationMs]);
}
