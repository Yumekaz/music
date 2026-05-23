import { shouldUseChromeAndroidBackgroundFallback } from "./browserCapabilities.js";
import {
  getChromeForegroundOnlyReason,
  hasChromeBackgroundAudioSource
} from "./chromeBackgroundAudio.js";

export const QUEUE_READINESS = Object.freeze({
  READY: "ready",
  FOREGROUND_ONLY: "foreground-only",
  MISSING_VIDEO: "missing-video",
  MISSING_PREVIEW: "missing-preview",
  PROVIDER_TIMEOUT: "provider-timeout",
  OFFLINE: "offline",
  UNAVAILABLE: "unavailable"
});

const BLOCKING_READINESS = new Set([
  QUEUE_READINESS.MISSING_VIDEO,
  QUEUE_READINESS.MISSING_PREVIEW,
  QUEUE_READINESS.PROVIDER_TIMEOUT,
  QUEUE_READINESS.OFFLINE,
  QUEUE_READINESS.UNAVAILABLE
]);

export function isReadinessBlocking(status) {
  return BLOCKING_READINESS.has(status);
}

export function getReadinessLabel(status) {
  switch (status) {
    case QUEUE_READINESS.READY:
      return "Ready";
    case QUEUE_READINESS.FOREGROUND_ONLY:
      return "Foreground only";
    case QUEUE_READINESS.MISSING_VIDEO:
      return "Missing video";
    case QUEUE_READINESS.MISSING_PREVIEW:
      return "Missing preview";
    case QUEUE_READINESS.PROVIDER_TIMEOUT:
      return "Provider timed out";
    case QUEUE_READINESS.OFFLINE:
      return "Offline";
    case QUEUE_READINESS.UNAVAILABLE:
      return "Unavailable";
    default:
      return "Unknown";
  }
}

export function getPlayerReadinessMessage(readiness) {
  const status = typeof readiness === "string" ? readiness : readiness?.status;
  switch (status) {
    case QUEUE_READINESS.FOREGROUND_ONLY:
      return readiness?.reason || "Chrome background unavailable for YouTube";
    case QUEUE_READINESS.MISSING_PREVIEW:
      return "Preview missing for this source";
    case QUEUE_READINESS.MISSING_VIDEO:
      return "Video source missing";
    case QUEUE_READINESS.PROVIDER_TIMEOUT:
      return "Provider timed out";
    case QUEUE_READINESS.OFFLINE:
      return "Connect to internet to play";
    case QUEUE_READINESS.UNAVAILABLE:
      return "Track unavailable";
    default:
      return "";
  }
}

function checked(status, reason, extra = {}) {
  return {
    status,
    reason: reason || getReadinessLabel(status),
    checkedAt: new Date().toISOString(),
    ...extra
  };
}

function hasDirectFallback(track) {
  return Boolean(track?.previewUrl || track?.jamendoUrl);
}

export function classifyTrackReadiness(track, options = {}) {
  const {
    sourceType = "youtube",
    online = true,
    settings = {},
    navigatorLike
  } = options;

  if (!online) return checked(QUEUE_READINESS.OFFLINE, "Offline");
  if (!track) return checked(QUEUE_READINESS.UNAVAILABLE, "No track");

  const directFallback = hasDirectFallback(track);
  const hasVideo = Boolean(track.videoId);
  const directSource = sourceType === "preview" || sourceType === "jamendo";

  if (directSource) {
    return directFallback
      ? checked(QUEUE_READINESS.READY, "Direct audio ready")
      : checked(QUEUE_READINESS.MISSING_PREVIEW, "Preview missing");
  }

  if (hasVideo) {
    if (
      shouldUseChromeAndroidBackgroundFallback(settings, navigatorLike) &&
      !hasChromeBackgroundAudioSource(track)
    ) {
      return checked(
        QUEUE_READINESS.FOREGROUND_ONLY,
        getChromeForegroundOnlyReason(track)
      );
    }
    return checked(QUEUE_READINESS.READY, "YouTube video ready");
  }

  if (directFallback) return checked(QUEUE_READINESS.READY, "Preview ready");
  return checked(QUEUE_READINESS.MISSING_VIDEO, "Video source missing");
}

function shouldResolve(track, readiness, options) {
  if (!track?.title) return false;
  if (readiness.status === QUEUE_READINESS.MISSING_VIDEO) return true;
  if (readiness.status === QUEUE_READINESS.MISSING_PREVIEW) return true;
  return Boolean(
    options.resolveChromePreview &&
    readiness.status === QUEUE_READINESS.FOREGROUND_ONLY
  );
}

function isTimeoutError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.name === "AbortError" || error?.name === "TimeoutError" || message.includes("timeout");
}

function mergeResolvedTrack(track, resolvedTrack) {
  if (!resolvedTrack) return track;
  return {
    ...track,
    ...resolvedTrack,
    id: track.id,
    title: track.title || resolvedTrack.title,
    artistName: track.artistName || resolvedTrack.artistName,
    previewUrl: resolvedTrack.previewUrl || track.previewUrl,
    jamendoUrl: resolvedTrack.jamendoUrl || track.jamendoUrl,
    videoId: resolvedTrack.videoId || track.videoId,
    durationMs: resolvedTrack.durationMs || track.durationMs,
    artworkUrl: track.artworkUrl || resolvedTrack.artworkUrl
  };
}

export async function preflightTrack(track, options = {}) {
  const initial = classifyTrackReadiness(track, options);
  if (!shouldResolve(track, initial, options)) return { readiness: initial, track };

  const resolveTrack = options.resolveTrack;
  if (typeof resolveTrack !== "function") return { readiness: initial, track };

  try {
    const resolvedTrack = await resolveTrack(
      track.title || "",
      track.artistName || track.artist || ""
    );
    const mergedTrack = mergeResolvedTrack(track, resolvedTrack);
    const readiness = classifyTrackReadiness(mergedTrack, options);

    if (
      initial.status === QUEUE_READINESS.MISSING_VIDEO &&
      readiness.status === QUEUE_READINESS.MISSING_VIDEO
    ) {
      return {
        readiness: checked(QUEUE_READINESS.UNAVAILABLE, "No playable source found"),
        track: mergedTrack
      };
    }

    return { readiness, track: mergedTrack };
  } catch (error) {
    return {
      readiness: checked(
        isTimeoutError(error) ? QUEUE_READINESS.PROVIDER_TIMEOUT : QUEUE_READINESS.UNAVAILABLE,
        isTimeoutError(error) ? "Provider timed out" : "Provider failed"
      ),
      track
    };
  }
}

export function getQueuePreflightWindow({ currentTrack, queue = [], count = 3 }) {
  const tracks = [];
  const seen = new Set();

  if (currentTrack?.id) {
    tracks.push(currentTrack);
    seen.add(currentTrack.id);
  }

  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  for (const track of queue.slice(startIndex, startIndex + count)) {
    if (!track?.id || seen.has(track.id)) continue;
    tracks.push(track);
    seen.add(track.id);
  }

  return tracks;
}

export async function preflightQueue(tracks, options = {}) {
  const entries = await Promise.all(
    tracks.map(async (track) => {
      const result = await preflightTrack(track, options);
      return [track.id, result];
    })
  );

  return entries.reduce(
    (acc, [trackId, result]) => {
      acc.readinessById[trackId] = result.readiness;
      if (result.track && result.track !== tracks.find((track) => track.id === trackId)) {
        acc.resolvedTracks[trackId] = result.track;
      }
      return acc;
    },
    { readinessById: {}, resolvedTracks: {} }
  );
}
