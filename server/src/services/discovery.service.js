import { tracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeTrack } from "../utils/normalize.js";
import { getTrendingMusic, searchYouTube } from "./providers/youtube.provider.js";
import { getSimilarArtists } from "./providers/lastfm.provider.js";

export async function getTrending(region = "IN") {
  return getOrSetCached(`discovery:trending:${region}`, 30 * 60, async () => {
    const trending = await getTrendingMusic(region, 8);
    const fallbackByVideoId = new Map(tracks.map((track) => [track.videoId, track]));
    return trending.map((item) => normalizeTrack(fallbackByVideoId.get(item.videoId) || item));
  });
}

export async function getRecommendations(seedArtists = []) {
  if (!seedArtists.length) return [];

  // Deduplicate and clean artist names
  const uniqueArtists = [...new Set(seedArtists.map((a) => a.trim()).filter(Boolean))].slice(0, 5);

  const sections = await Promise.all(
    uniqueArtists.map(async (artistName) => {
      const cacheKey = `recs:${artistName.toLowerCase()}`;
      return getOrSetCached(cacheKey, 60 * 60, async () => {
        // Step 1: Get similar artists from Last.fm
        let similarNames = [];
        try {
          const similar = await getSimilarArtists(artistName);
          similarNames = similar
            .map((a) => a.name || a)
            .filter(Boolean)
            .slice(0, 3);
        } catch {
          // Last.fm might fail, that's fine
        }

        // Step 2: Search YouTube for the seed artist + similar artists
        const searchQueries = [
          `${artistName} popular songs`,
          ...similarNames.map((name) => `${name} songs`)
        ];

        const results = await Promise.all(
          searchQueries.map((q) => searchYouTube(q, 4).catch(() => []))
        );

        // Flatten and deduplicate by videoId
        const seen = new Set();
        const allTracks = results.flat().filter((track) => {
          if (!track.videoId || seen.has(track.videoId)) return false;
          seen.add(track.videoId);
          return true;
        });

        return {
          title: `More like ${artistName}`,
          seedArtist: artistName,
          similarArtists: similarNames,
          tracks: allTracks.slice(0, 8).map(normalizeTrack)
        };
      });
    })
  );

  return sections.filter((s) => s.tracks.length > 0);
}
