import { useEffect, useRef } from "react";
import { getDirectAudioElement, syncAudioStateSync, getSilenceWavUrl } from "../lib/directAudio.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { getChromeBackgroundHandoff, isOfficialChromeAndroid } from "../lib/browserPlayback.js";

export function useDirectAudio({ track, sourceType, isPlaying, volume, onTimeUpdate, onEnded, skipSync = false }) {
  const audioRef = useRef(getDirectAudioElement());
  const isDirect = sourceType === "preview" || sourceType === "jamendo";
  const seekTarget = usePlayerStore((state) => state.seekTarget);

  const prevSourceTypeRef = useRef(sourceType);
  const crossfadeDuration = useSettingsStore((state) => state.crossfadeDuration);

  // Declarative state synchronization
  useEffect(() => {
    if (skipSync) return;
    const wasYouTube = prevSourceTypeRef.current === "youtube";
    syncAudioStateSync(track, sourceType, isPlaying, volume, {
      crossfadeDuration,
      wasYouTube
    });
    prevSourceTypeRef.current = sourceType;
  }, [track, sourceType, isPlaying, volume, crossfadeDuration, skipSync]);

  // Handle seekTarget
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTarget === null) return;

    if (isDirect) {
      audio.currentTime = seekTarget / 1000;
      usePlayerStore.getState().setSeekTarget(null);
    } else if (isOfficialChromeAndroid() && !getChromeBackgroundHandoff()) {
      const dur = audio.duration;
      const loopDur = (dur && !isNaN(dur)) ? dur : 30;
      audio.currentTime = (seekTarget / 1000) % loopDur;
    }
  }, [isDirect, seekTarget]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const state = usePlayerStore.getState();
      const silenceUrl = getSilenceWavUrl();
      if (audio.src === silenceUrl) return;
      if (state.sourceType === "youtube" && !getChromeBackgroundHandoff()) return;
      const durationMs = Number.isFinite(audio.duration)
        ? audio.duration * 1000
        : state.durationMs || state.currentTrack?.durationMs || 0;
      onTimeUpdate?.(audio.currentTime * 1000, durationMs);
    };

    const handleEnded = () => {
      const state = usePlayerStore.getState();
      const silenceUrl = getSilenceWavUrl();
      if (audio.src === silenceUrl) return;
      if (state.sourceType === "youtube" && !getChromeBackgroundHandoff()) return;
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
