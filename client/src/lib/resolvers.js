export function getTrackSubtitle(track) {
  return [track?.artistName, track?.albumName].filter(Boolean).join(" - ");
}

export function isDirectAudioSource(sourceType) {
  return sourceType === "preview" || sourceType === "jamendo";
}
