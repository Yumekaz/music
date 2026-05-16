import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore.js";

export function useMediaSession() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const seek = usePlayerStore((state) => state.seek);
  const setSeekTarget = usePlayerStore((state) => state.setSeekTarget);

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

    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
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
  }, [currentTrack, togglePlay, next, previous, seek, setSeekTarget]);

  // Sync playback state
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);
}
