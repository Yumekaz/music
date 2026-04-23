let directAudioElement;

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
