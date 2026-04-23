import { findTrackById, resolveFixtureTrack } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeTrack } from "../utils/normalize.js";
import { getLyricsFromLrclib } from "./providers/lrclib.provider.js";

export async function getLyricsForTrackId(id) {
  const track = findTrackById(id);
  if (!track) return null;

  return getOrSetCached(`lyrics:${id}`, 7 * 24 * 60 * 60, () => getLyricsFromLrclib(normalizeTrack(track)));
}

export async function getLyricsForTitle(title, artist) {
  const track = resolveFixtureTrack(title, artist);
  return getLyricsForTrackId(track.id);
}
