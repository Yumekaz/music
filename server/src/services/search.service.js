import { albums, artists, searchFixtureAlbums, searchFixtureArtists, searchFixtureTracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeAlbum, normalizeArtist, normalizeTrack } from "../utils/normalize.js";
import { getTopTracks } from "./providers/lastfm.provider.js";
import { searchYouTube } from "./providers/youtube.provider.js";

const TTL = {
  search: 60 * 60,
  charts: 6 * 60 * 60
};

export async function searchCatalog(query, limit = 8) {
  const key = `search:${query}:${limit}`;
  return getOrSetCached(key, TTL.search, async () => {
    const [youtubeResults] = await Promise.all([searchYouTube(query, limit)]);
    const fixtureTracks = searchFixtureTracks(query, limit);
    const fixtureByVideoId = new Map(fixtureTracks.map((track) => [track.videoId, track]));
    const relatedArtistIds = new Set(fixtureTracks.map((track) => track.artistId));
    const relatedAlbumIds = new Set(fixtureTracks.map((track) => track.albumId));

    const tracks = youtubeResults.map((result) => {
      const fixture = fixtureByVideoId.get(result.videoId);
      return normalizeTrack(fixture || result, {
        ...result,
        id: fixture?.id || result.id,
        lyricsAvailable: fixture?.lyricsAvailable || false,
        previewUrl: fixture?.previewUrl || "",
        availableProviders: fixture?.availableProviders || ["youtube"],
        externalLinks: fixture?.externalLinks || {
          youtube: result.videoId ? `https://www.youtube.com/watch?v=${result.videoId}` : ""
        }
      });
    });

    return {
      tracks,
      artists: [
        ...searchFixtureArtists(query, limit),
        ...artists.filter((artist) => relatedArtistIds.has(artist.id))
      ]
        .filter((artist, index, rows) => rows.findIndex((row) => row.id === artist.id) === index)
        .slice(0, limit)
        .map(normalizeArtist),
      albums: [
        ...searchFixtureAlbums(query, limit),
        ...albums.filter((album) => relatedAlbumIds.has(album.id))
      ].filter((album, index, rows) => rows.findIndex((row) => row.id === album.id) === index)
        .slice(0, limit)
        .map((album) =>
        normalizeAlbum(album, {
          tracks: fixtureTracks.filter((track) => track.albumId === album.id).map(normalizeTrack)
        })
      )
    };
  });
}

export async function getCharts() {
  return getOrSetCached("discovery:charts", TTL.charts, async () => {
    const topTracks = await getTopTracks();
    const resolvedTracks = await Promise.all(
      topTracks.slice(0, 8).map(async (track) => {
        if (track.videoId) {
          return track;
        }
        try {
          const query = `${track.title} ${track.artistName}`;
          const ytResults = await searchYouTube(query, 1);
          if (ytResults && ytResults.length > 0) {
            const yt = ytResults[0];
            return {
              ...track,
              videoId: yt.videoId,
              durationMs: yt.durationMs || track.durationMs || 0,
              artworkUrl: (!track.artworkUrl || track.artworkUrl.includes("2a96cbd8b46e442fc41c2b86b821562f"))
                ? yt.artworkUrl
                : track.artworkUrl,
              externalLinks: {
                ...track.externalLinks,
                youtube: `https://www.youtube.com/watch?v=${yt.videoId}`
              }
            };
          }
        } catch (e) {
          console.warn("Failed to resolve chart track from YouTube:", track.title, e);
        }
        return track;
      })
    );

    return {
      tracks: resolvedTracks.map((track) => normalizeTrack(track, { lyricsAvailable: Boolean(track.lyricsAvailable) })),
      artists: artists.map(normalizeArtist),
      albums: albums.map(normalizeAlbum)
    };
  });
}
