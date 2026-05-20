import { findTrackById, resolveFixtureTrack } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeTrack } from "../utils/normalize.js";
import { getLyricsFromLrclib } from "./providers/lrclib.provider.js";

export async function getLyricsForTrackId(id, title, artist) {
  const track = findTrackById(id);
  if (track) {
    return getOrSetCached(`lyrics:${id}`, 7 * 24 * 60 * 60, () => getLyricsFromLrclib(normalizeTrack(track)));
  }

  if (title && artist) {
    const dynamicTrack = {
      id,
      title,
      artistName: artist,
      albumName: "",
      durationMs: 0
    };
    return getOrSetCached(`lyrics:${id}`, 7 * 24 * 60 * 60, () => getLyricsFromLrclib(dynamicTrack));
  }

  return null;
}

export async function getLyricsForTitle(title, artist) {
  const track = resolveFixtureTrack(title, artist);
  return getLyricsForTrackId(track.id, title, artist);
}
