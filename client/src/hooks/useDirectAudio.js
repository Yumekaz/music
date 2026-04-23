import { useEffect, useRef } from "react";
import { getDirectAudioElement, loadDirectAudio } from "../lib/directAudio.js";

export function useDirectAudio({ track, sourceType, isPlaying, volume, onTimeUpdate, onEnded }) {
  const audioRef = useRef(getDirectAudioElement());
  const isDirect = sourceType === "preview" || sourceType === "jamendo";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isDirect || !track) return;

    loadDirectAudio(track, sourceType);
  }, [isDirect, sourceType, track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isDirect) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isDirect, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => onTimeUpdate?.(audio.currentTime * 1000, audio.duration * 1000);
    const handleEnded = () => onEnded?.();

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
