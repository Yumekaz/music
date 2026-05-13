let directAudioElement;
let fadeTimer = null;

export function getDirectAudioElement() {
  if (typeof Audio === "undefined") return null;

  if (!directAudioElement) {
    directAudioElement = new Audio();
    directAudioElement.preload = "metadata";
  }

  return directAudioElement;
}

export function getDirectAudioSource(track, sourceType) {
  if (!track) return "";
  return sourceType === "jamendo" ? track.jamendoUrl || track.previewUrl || "" : track.previewUrl || "";
}

export function loadDirectAudio(track, sourceType) {
  const audio = getDirectAudioElement();
  const src = getDirectAudioSource(track, sourceType);
  if (!audio || !src) return null;

  if (audio.src !== src) {
    audio.src = src;
    audio.load();
  }

  return audio;
}

export async function playDirectAudio(track, sourceType) {
  const audio = loadDirectAudio(track, sourceType);
  if (!audio) return false;
  await audio.play();
  return true;
}

export function pauseDirectAudio() {
  const audio = getDirectAudioElement();
  audio?.pause();
}

/**
 * Smooth transition to a new track:
 * fade out current → hard-cut to new src → fade in.
 * Each phase takes durationSecs/2. Falls back to hard cut if durationSecs <= 0.
 */
export function fadeOutAndSwap(track, sourceType, durationSecs) {
  const audio = getDirectAudioElement();
  if (!audio) return;

  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }

  const src = getDirectAudioSource(track, sourceType);
  if (!src) return;

  // Hard cut if crossfade is disabled or audio isn't playing
  if (durationSecs <= 0 || audio.paused) {
    audio.src = src;
    audio.load();
    audio.play().catch(() => {});
    return;
  }

  const startVol = audio.volume;
  const STEPS = 20;
  const stepMs = (durationSecs * 500) / STEPS; // half duration for fade out
  let step = 0;

  // Phase 1: fade out
  fadeTimer = setInterval(() => {
    step++;
    audio.volume = Math.max(0, startVol * (1 - step / STEPS));

    if (step >= STEPS) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      audio.pause();

      // Switch to new track at zero volume
      audio.src = src;
      audio.volume = 0;
      audio.load();
      audio.play().catch(() => {});

      // Phase 2: fade in
      let inStep = 0;
      fadeTimer = setInterval(() => {
        inStep++;
        audio.volume = Math.min(startVol, startVol * (inStep / STEPS));
        if (inStep >= STEPS) {
          clearInterval(fadeTimer);
          fadeTimer = null;
          audio.volume = startVol;
        }
      }, stepMs);
    }
  }, stepMs);
}
