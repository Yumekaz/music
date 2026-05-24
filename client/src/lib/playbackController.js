import { getRecommendations } from "../services/search.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { getDirectAudioElement, syncAudioStateSync } from "./directAudio.js";
import { shouldUseChromeAndroidBackgroundFallback } from "./browserCapabilities.js";
import { isReadinessBlocking, getPlayerReadinessMessage } from "./queuePreflight.js";
import {
  getChromeForegroundOnlyReason,
  hasChromeBackgroundAudioSource
} from "./chromeBackgroundAudio.js";

export const PLAYBACK_ENGINES = Object.freeze({
  YOUTUBE_IFRAME: "youtube-iframe",
  DIRECT_AUDIO: "direct-audio",
  CHROME_FALLBACK: "chrome-fallback",
  NONE: "none"
});

export function resolveSourceType(track, sourceType) {
  if (sourceType === "youtube" && !track?.videoId && track?.previewUrl) return "preview";
  return sourceType;
}

export function isDirectSourceType(sourceType) {
  return sourceType === "preview" || sourceType === "jamendo";
}

export function resolvePlaybackEngine(track, sourceType, settings, navigatorLike) {
  if (!track) return PLAYBACK_ENGINES.NONE;

  const resolvedSourceType = resolveSourceType(track, sourceType);
  if (isDirectSourceType(resolvedSourceType)) return PLAYBACK_ENGINES.DIRECT_AUDIO;

  if (resolvedSourceType === "youtube") {
    return shouldUseChromeAndroidBackgroundFallback(settings, navigatorLike) &&
      hasChromeBackgroundAudioSource(track)
      ? PLAYBACK_ENGINES.CHROME_FALLBACK
      : PLAYBACK_ENGINES.YOUTUBE_IFRAME;
  }

  return PLAYBACK_ENGINES.NONE;
}

export function getPlaybackEngineLabel(engine) {
  switch (engine) {
    case PLAYBACK_ENGINES.YOUTUBE_IFRAME:
      return "YouTube iframe";
    case PLAYBACK_ENGINES.DIRECT_AUDIO:
      return "Direct audio";
    case PLAYBACK_ENGINES.CHROME_FALLBACK:
      return "Chrome fallback";
    default:
      return "None";
  }
}

function playbackFailure(message, extra = {}) {
  if (!message) return null;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    ...extra
  };
}

function getTrackArtist(track) {
  return track?.artistName || track?.artist || "";
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function updateAudioState(get) {
  const { currentTrack, sourceType, isPlaying, volume } = get();
  syncAudioStateSync(currentTrack, sourceType, isPlaying, volume);
}

function resetDirectAudioToStart() {
  if (typeof Audio === "undefined") return;
  const audio = getDirectAudioElement();
  if (audio) audio.currentTime = 0;
}

function queueIndexForState(state) {
  return state.queue.findIndex((track) => track.id === state.currentTrack?.id);
}

function getNextQueueCandidates(state) {
  const { queue, currentTrack, shuffle, repeat } = state;
  if (!queue.length) return [];

  const index = queueIndexForState(state);

  if (shuffle) {
    const others = queue.filter((_, i) => i !== index);
    if (!others.length) return [];
    return [others[Math.floor(Math.random() * others.length)]];
  }

  const nextIndex = index + 1;
  if (nextIndex >= queue.length) {
    return repeat === "all" ? [queue[0]] : [];
  }

  return queue.slice(nextIndex);
}

function markSkipped(set, track, readiness) {
  const message = getPlayerReadinessMessage(readiness) || "Track unavailable";
  set((state) => ({
    skippedUnavailableTrackIds: {
      ...state.skippedUnavailableTrackIds,
      [track.id]: true
    },
    playbackFailure: playbackFailure(message, {
      trackId: track.id,
      status: readiness?.status || readiness
    })
  }));
}

export function createPlaybackController({ get, set }) {
  function resolveChromeBackgroundAudioIfNeeded(track, sourceType, volume) {
    const settings = useSettingsStore.getState();
    const chromeBackgroundFallback = shouldUseChromeAndroidBackgroundFallback(settings);

    if (track && chromeBackgroundFallback && sourceType === "youtube") {
      syncAudioStateSync(track, "youtube", true, volume);
    }

    return track;
  }

  async function playTrack(track, sourceType = "youtube") {
    const { volume } = get();
    const backgroundResult = resolveChromeBackgroundAudioIfNeeded(track, sourceType, volume);
    const trackToPlay = backgroundResult && typeof backgroundResult.then === "function"
      ? await backgroundResult
      : backgroundResult;
    const resolvedSourceType = resolveSourceType(trackToPlay, sourceType);
    const settings = useSettingsStore.getState();
    const activeEngine = resolvePlaybackEngine(trackToPlay, resolvedSourceType, settings);
    const chromeForegroundOnly =
      shouldUseChromeAndroidBackgroundFallback(settings) &&
      resolvedSourceType === "youtube" &&
      !hasChromeBackgroundAudioSource(trackToPlay);
    const documentHidden = isDocumentHidden();
    const shouldPlay = Boolean(trackToPlay) && !(chromeForegroundOnly && documentHidden);

    syncAudioStateSync(trackToPlay, resolvedSourceType, shouldPlay, volume);

    const previousFailure = get().playbackFailure;

    set({
      currentTrack: trackToPlay,
      sourceType: resolvedSourceType,
      isPlaying: shouldPlay,
      isBuffering: false,
      positionMs: 0,
      durationMs: trackToPlay?.durationMs || 0,
      activeEngine,
      playbackFailure: chromeForegroundOnly && documentHidden
        ? playbackFailure(getChromeForegroundOnlyReason(trackToPlay), {
            trackId: trackToPlay?.id,
            status: "foreground-only"
          })
        : previousFailure?.trackId && previousFailure.trackId !== trackToPlay?.id
          ? previousFailure
        : null
    });
  }

  function pause() {
    set({ isPlaying: false });
    updateAudioState(get);
  }

  function resume() {
    const { currentTrack } = get();
    set({ isPlaying: Boolean(currentTrack) });
    updateAudioState(get);
  }

  function togglePlay() {
    const { currentTrack, isPlaying } = get();
    set({ isPlaying: Boolean(currentTrack) && !isPlaying });
    updateAudioState(get);
  }

  function seek(positionMs) {
    set({ positionMs, seekTarget: positionMs });
  }

  function setVolume(volume) {
    set({ volume });
    updateAudioState(get);
  }

  async function autoPlay() {
    const { currentTrack } = get();
    if (!currentTrack) return;

    const artistName = getTrackArtist(currentTrack);
    if (!artistName) return;

    try {
      const data = await getRecommendations([artistName]);
      const section = data?.sections?.[0];
      if (!section?.tracks?.length) return;

      const candidates = section.tracks.filter((track) => track.id !== currentTrack.id);
      if (!candidates.length) return;

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      await playTrack(pick, "youtube");
    } catch {
      set({
        playbackFailure: playbackFailure("Could not fetch recommendations", {
          status: "provider-timeout"
        })
      });
    }
  }

  async function next() {
    const state = get();

    if (state.repeat === "one") {
      seek(0);
      set({ isPlaying: true });
      resetDirectAudioToStart();
      updateAudioState(get);
      return;
    }

    const candidates = getNextQueueCandidates(state);
    if (!candidates.length) {
      await autoPlay();
      return;
    }

    for (const candidate of candidates) {
      const readiness = state.queueReadiness?.[candidate.id];
      if (
        readiness &&
        isReadinessBlocking(readiness.status) &&
        !state.skippedUnavailableTrackIds?.[candidate.id]
      ) {
        markSkipped(set, candidate, readiness);
        continue;
      }

      await playTrack(candidate, "youtube");
      return;
    }

    await autoPlay();
  }

  async function previous() {
    const state = get();

    if (state.positionMs > 3000) {
      seek(0);
      resetDirectAudioToStart();
      return;
    }

    if (!state.queue.length) return;
    const index = queueIndexForState(state);
    const previousTrack = state.queue[(index - 1 + state.queue.length) % state.queue.length];
    await playTrack(previousTrack, "youtube");
  }

  return {
    playTrack,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    next,
    previous,
    autoPlay
  };
}
