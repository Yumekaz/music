export function getChromeBackgroundAudioSourceType() {
  // Never treat Jamendo as a background substitute for a YouTube video.
  // Provider matches can be loose, and wrong audio is worse than foreground-only playback.
  return "";
}

export function hasChromeBackgroundAudioSource(track) {
  return Boolean(getChromeBackgroundAudioSourceType(track));
}

export function getChromeForegroundOnlyReason(track) {
  if (track?.jamendoUrl) {
    return "Chrome background disabled to avoid mismatched Jamendo audio";
  }
  return track?.previewUrl
    ? "Chrome background only has a 30s preview"
    : "Chrome background audio unavailable";
}
