export function getChromeBackgroundAudioSourceType(track) {
  return track?.jamendoUrl ? "jamendo" : "";
}

export function hasChromeBackgroundAudioSource(track) {
  return Boolean(getChromeBackgroundAudioSourceType(track));
}

export function getChromeForegroundOnlyReason(track) {
  return track?.previewUrl
    ? "Chrome background only has a 30s preview"
    : "Chrome background audio unavailable";
}
