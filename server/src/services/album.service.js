import { findAlbumById, tracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeAlbum, normalizeTrack } from "../utils/normalize.js";

export async function getAlbum(id) {
  const album = findAlbumById(id);
  if (!album) return null;

  return getOrSetCached(`album:${id}`, 7 * 24 * 60 * 60, async () =>
    normalizeAlbum(album, {
      tracks: tracks.filter((track) => track.albumId === id).map(normalizeTrack)
    })
  );
}
