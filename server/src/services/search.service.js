import { albums, artists, searchFixtureAlbums, searchFixtureArtists, searchFixtureTracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeAlbum, normalizeArtist, normalizeTrack, matchesTitleAndArtist } from "../utils/normalize.js";
import { getTopTracks } from "./providers/lastfm.provider.js";
import { searchYouTube } from "./providers/youtube.provider.js";
import { searchItunesPreview } from "./providers/itunes.provider.js";
import { searchJamendo } from "./providers/jamendo.provider.js";

const TTL = {
  search: 60 * 60,
  charts: 6 * 60 * 60
};

export async function searchCatalog(query, limit = 8) {
  const key = `search:${query}:${limit}`;
  return getOrSetCached(key, TTL.search, async () => {
    const [youtubeResults, itunesResults, jamendoResults] = await Promise.all([
      searchYouTube(query, limit),
      searchItunesPreview(query, limit),
      searchJamendo(query, limit)
    ]);

    const fixtureTracks = searchFixtureTracks(query, limit);
    const fixtureByVideoId = new Map(fixtureTracks.map((track) => [track.videoId, track]));
    const relatedArtistIds = new Set(fixtureTracks.map((track) => track.artistId));
    const relatedAlbumIds = new Set(fixtureTracks.map((track) => track.albumId));

    const mergedItunesIds = new Set();
    const mergedJamendoIds = new Set();

    // Map and merge YouTube results
    const ytTracks = youtubeResults.map((result) => {
      const fixture = fixtureByVideoId.get(result.videoId);

      // Find matching iTunes result for previewUrl
      let matchedPreviewUrl = "";
      let matchedDuration = 0;
      let matchedArtwork = "";
      const itunesMatch = itunesResults.find((itunesTrack, idx) => {
        if (mergedItunesIds.has(idx)) return false;
        if (matchesTitleAndArtist(itunesTrack.title, itunesTrack.artistName, result.title, result.artistName)) {
          mergedItunesIds.add(idx);
          return true;
        }
        return false;
      });

      if (itunesMatch) {
        matchedPreviewUrl = itunesMatch.previewUrl;
        matchedDuration = itunesMatch.durationMs;
        matchedArtwork = itunesMatch.artworkUrl;
      }

      // Find matching Jamendo result
      let matchedJamendoUrl = "";
      const jamendoMatch = jamendoResults.find((jamTrack, idx) => {
        if (mergedJamendoIds.has(idx)) return false;
        if (matchesTitleAndArtist(jamTrack.title, jamTrack.artistName, result.title, result.artistName)) {
          mergedJamendoIds.add(idx);
          return true;
        }
        return false;
      });

      if (jamendoMatch) {
        matchedJamendoUrl = jamendoMatch.jamendoUrl || jamendoMatch.previewUrl || "";
      }

      return normalizeTrack(fixture || result, {
        ...result,
        id: fixture?.id || result.id,
        lyricsAvailable: fixture?.lyricsAvailable || false,
        previewUrl: fixture?.previewUrl || matchedPreviewUrl || "",
        jamendoUrl: fixture?.jamendoUrl || matchedJamendoUrl || "",
        durationMs: fixture?.durationMs || result.durationMs || matchedDuration || 0,
        artworkUrl: fixture?.artworkUrl || result.artworkUrl || matchedArtwork || "",
        availableProviders: fixture?.availableProviders || [
          "youtube",
          ...(matchedPreviewUrl ? ["itunes"] : []),
          ...(matchedJamendoUrl ? ["jamendo"] : [])
        ],
        externalLinks: fixture?.externalLinks || {
          youtube: result.videoId ? `https://www.youtube.com/watch?v=${result.videoId}` : ""
        }
      });
    });

    // Format remaining iTunes tracks that weren't merged
    const remainingItunesTracks = itunesResults
      .filter((_, idx) => !mergedItunesIds.has(idx))
      .map((item, idx) => {
        const id = `itunes-${item.title.toLowerCase().replace(/[^a-z0-9]/g, "")}-${idx}`;
        return normalizeTrack({
          id,
          title: item.title,
          artistName: item.artistName,
          albumName: item.albumName,
          previewUrl: item.previewUrl,
          durationMs: item.durationMs,
          artworkUrl: item.artworkUrl,
          availableProviders: ["itunes", "apple"],
          source: "itunes"
        });
      });

    // Format remaining Jamendo tracks that weren't merged
    const remainingJamendoTracks = jamendoResults
      .filter((_, idx) => !mergedJamendoIds.has(idx))
      .map((item) => {
        return normalizeTrack({
          id: `jamendo-${item.jamendoId}`,
          jamendoId: item.jamendoId,
          title: item.title,
          artistName: item.artistName,
          albumName: item.albumName,
          previewUrl: item.previewUrl,
          jamendoUrl: item.jamendoUrl || item.previewUrl,
          durationMs: item.durationMs,
          artworkUrl: item.artworkUrl,
          availableProviders: ["jamendo"],
          source: "jamendo"
        });
      });

    // Combine all tracks
    const tracks = [...ytTracks, ...remainingItunesTracks, ...remainingJamendoTracks].slice(0, limit);

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
    const { getPreviewForTrack } = await import("./providers/itunes.provider.js");

    const resolvedTracks = await Promise.all(
      topTracks.slice(0, 8).map(async (track) => {
        if (track.videoId) {
          return track;
        }

        let resolved = { ...track };

        // 1. Try to resolve via YouTube (if API key is available and non-fallback)
        try {
          const query = `${track.title} ${track.artistName}`;
          const ytResults = await searchYouTube(query, 1);
          if (ytResults && ytResults.length > 0 && !ytResults[0].source.startsWith("fallback")) {
            const yt = ytResults[0];
            resolved = {
              ...resolved,
              videoId: yt.videoId,
              durationMs: yt.durationMs || resolved.durationMs || 0,
              artworkUrl: (!resolved.artworkUrl || resolved.artworkUrl.includes("2a96cbd8b46e442fc41c2b86b821562f"))
                ? yt.artworkUrl
                : resolved.artworkUrl,
              externalLinks: {
                ...resolved.externalLinks,
                youtube: `https://www.youtube.com/watch?v=${yt.videoId}`
              }
            };
            return resolved;
          }
        } catch (e) {
          console.warn("Failed to resolve chart track from YouTube:", track.title, e);
        }

        // 2. Fallback: Resolve via iTunes (no API key required) to get valid duration and artwork
        try {
          const itunesMatch = await getPreviewForTrack(track.title, track.artistName);
          if (itunesMatch) {
            resolved = {
              ...resolved,
              previewUrl: itunesMatch.previewUrl || resolved.previewUrl || "",
              durationMs: itunesMatch.durationMs || resolved.durationMs || 0,
              artworkUrl: (!resolved.artworkUrl || resolved.artworkUrl.includes("2a96cbd8b46e442fc41c2b86b821562f"))
                ? (itunesMatch.artworkUrl || resolved.artworkUrl)
                : resolved.artworkUrl
            };
          }
        } catch (e) {
          console.warn("Failed to resolve chart track from iTunes:", track.title, e);
        }

        return resolved;
      })
    );

    return {
      tracks: resolvedTracks.map((track) => normalizeTrack(track, { lyricsAvailable: Boolean(track.lyricsAvailable) })),
      artists: artists.map(normalizeArtist),
      albums: albums.map(normalizeAlbum)
    };
  });
}
