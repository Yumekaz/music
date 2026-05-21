import { useEffect, useRef } from "react";
import { getDirectAudioElement, loadDirectAudio, loadDirectAudioSync, fadeOutAndSwap, getSilenceWavUrl } from "../lib/directAudio.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";

export function useDirectAudio({ track, sourceType, isPlaying, volume, onTimeUpdate, onEnded }) {
  const audioRef = useRef(getDirectAudioElement());
  const isDirect = sourceType === "preview" || sourceType === "jamendo";
  const seekTarget = usePlayerStore((state) => state.seekTarget);

  // Stable refs so track-change effect doesn't re-run on every render
  const isPlayingRef = useRef(isPlaying);
  const crossfadeDurationRef = useRef(useSettingsStore.getState().crossfadeDuration);
  const prevSourceTypeRef = useRef(sourceType);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => {
    return useSettingsStore.subscribe(
      (state) => state.crossfadeDuration,
      (v) => { crossfadeDurationRef.current = v; }
    );
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isDirect) {
      audio.volume = volume;
    }
  }, [volume, isDirect]);

  // Track change: use crossfade when playing, plain load when paused
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isDirect || !track) return;

    const wasYouTube = prevSourceTypeRef.current === "youtube";

    if (isPlayingRef.current && crossfadeDurationRef.current > 0 && !wasYouTube) {
      fadeOutAndSwap(track, sourceType, crossfadeDurationRef.current, volume);
    } else {
      loadDirectAudioSync(track, sourceType);
      audio.volume = volume;
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirect, sourceType, track, volume]);

  // Keep prevSourceTypeRef updated
  useEffect(() => {
    prevSourceTypeRef.current = sourceType;
  }, [sourceType]);

  // Play / pause and silence loop handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isDirect) {
      audio.loop = false;
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    } else {
      // isDirect is false (YouTube is the active player)
      if (isPlaying) {
        const silenceUrl = getSilenceWavUrl();
        if (audio.src !== silenceUrl) {
          audio.src = silenceUrl;
          audio.loop = true;
          audio.volume = 0.001;
          audio.load();
        }
        audio.play().catch(() => {});
      } else {
        const silenceUrl = getSilenceWavUrl();
        if (audio.src === silenceUrl) {
          audio.pause();
        }
      }
    }
  }, [isDirect, isPlaying]);

  // Handle seekTarget
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isDirect || seekTarget === null) return;

    audio.currentTime = seekTarget / 1000;
    usePlayerStore.getState().setSeekTarget(null);
  }, [isDirect, seekTarget]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const silenceUrl = getSilenceWavUrl();
      if (audio.src === silenceUrl) return;
      onTimeUpdate?.(audio.currentTime * 1000, audio.duration * 1000);
    };

    const handleEnded = () => {
      const silenceUrl = getSilenceWavUrl();
      if (audio.src === silenceUrl) return;
      onEnded?.();
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onEnded, onTimeUpdate]);

  return audioRef;
}

