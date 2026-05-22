import { useEffect, useMemo } from "react";
import { resolveTrack } from "../services/tracks.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useSettingsStore } from "../store/settingsStore.js";
import { getQueuePreflightWindow, preflightQueue } from "../lib/queuePreflight.js";

function trackSignature(track) {
  if (!track) return "";
  return [
    track.id,
    track.videoId || "",
    track.previewUrl || "",
    track.jamendoUrl || "",
    track.title || "",
    track.artistName || track.artist || ""
  ].join(":");
}

export function useQueuePreflight({ online }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const sourceType = usePlayerStore((state) => state.sourceType);
  const mergeQueueReadiness = usePlayerStore((state) => state.mergeQueueReadiness);
  const clearQueueReadiness = usePlayerStore((state) => state.clearQueueReadiness);
  const mergeResolvedTrack = usePlayerStore((state) => state.mergeResolvedTrack);
  const mobileBackgroundFallback = useSettingsStore((state) => state.mobileBackgroundFallback);

  const preflightTracks = useMemo(
    () => getQueuePreflightWindow({ currentTrack, queue, count: 3 }),
    [currentTrack, queue]
  );

  const signature = useMemo(
    () => preflightTracks.map(trackSignature).join("|"),
    [preflightTracks]
  );

  useEffect(() => {
    let cancelled = false;

    if (!preflightTracks.length) {
      clearQueueReadiness();
      return () => {
        cancelled = true;
      };
    }

    preflightQueue(preflightTracks, {
      sourceType,
      online,
      settings: { mobileBackgroundFallback },
      resolveChromePreview: true,
      resolveTrack
    }).then(({ readinessById, resolvedTracks }) => {
      if (cancelled) return;

      mergeQueueReadiness(readinessById);
      Object.entries(resolvedTracks).forEach(([trackId, resolvedTrack]) => {
        mergeResolvedTrack(trackId, resolvedTrack);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    clearQueueReadiness,
    mergeQueueReadiness,
    mergeResolvedTrack,
    mobileBackgroundFallback,
    online,
    preflightTracks,
    signature,
    sourceType
  ]);
}
