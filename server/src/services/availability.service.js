import { findTrackById } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { getProviderLinks } from "./providers/odesli.provider.js";

export async function getAvailability(trackId) {
  const track = findTrackById(trackId);
  if (!track) return null;

  return getOrSetCached(`availability:${trackId}`, 24 * 60 * 60, async () => ({
    trackId,
    links: await getProviderLinks(track)
  }));
}
