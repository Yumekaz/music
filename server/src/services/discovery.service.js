import { tracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeTrack } from "../utils/normalize.js";
import { getTrendingMusic } from "./providers/youtube.provider.js";

export async function getTrending(region = "IN") {
  return getOrSetCached(`discovery:trending:${region}`, 30 * 60, async () => {
    const trending = await getTrendingMusic(region, 8);
    const fallbackByVideoId = new Map(tracks.map((track) => [track.videoId, track]));
    return trending.map((item) => normalizeTrack(fallbackByVideoId.get(item.videoId) || item));
  });
}
