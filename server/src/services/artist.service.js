import { albums, findArtistById, tracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeAlbum, normalizeArtist, normalizeTrack } from "../utils/normalize.js";
import { getArtistInfo, getSimilarArtists } from "./providers/lastfm.provider.js";
import { getTasteDiveSimilar } from "./providers/tastedive.provider.js";
import { getAudioDbArtist } from "./providers/theaudiodb.provider.js";
import { searchYouTube } from "./providers/youtube.provider.js";

/**
 * Resolve an artist ID — supports both fixture IDs and lastfm-slug format.
 * Returns { name, fixture? } or null.
 */
function resolveArtistId(id) {
  // Check fixture first
  const fixture = findArtistById(id);
  if (fixture) return { name: fixture.name, fixture };

  // Handle lastfm-slug format: "lastfm-the-weeknd" → "the weeknd"
  if (id.startsWith("lastfm-")) {
    const slug = id.slice(7); // Remove "lastfm-"
    const name = slug.replace(/-/g, " ");
    return { name, fixture: null };
  }

  return null;
}

export async function getArtistProfile(id) {
  const resolved = resolveArtistId(id);
  if (!resolved) return null;

  return getOrSetCached(`artist:${id}`, 24 * 60 * 60, async () => {
    const [lastfm, audioDb, similar, ytResults] = await Promise.all([
      getArtistInfo(resolved.name),
      getAudioDbArtist(resolved.name),
      getSimilarArtists(resolved.name),
      searchYouTube(`${resolved.name} popular songs`, 8)
    ]);

    const topTracks = resolved.fixture
      ? tracks.filter((track) => track.artistId === id).map(normalizeTrack)
      : (ytResults || []).map((yt) => normalizeTrack({
          id: yt.id,
          title: yt.title,
          artistName: yt.artistName || resolved.name,
          artworkUrl: yt.artworkUrl || "",
          durationMs: yt.durationMs || 0,
          videoId: yt.videoId || yt.id,
          availableProviders: ["youtube"],
          externalLinks: { youtube: `https://www.youtube.com/watch?v=${yt.videoId || yt.id}` }
        }));

    return normalizeArtist(
      {
        ...(resolved.fixture || {}),
        id,
        name: lastfm?.name || resolved.name,
        ...lastfm,
        imageUrl: audioDb?.imageUrl || lastfm?.imageUrl || "",
        bio: audioDb?.bio || lastfm?.bio || ""
      },
      {
        similarArtists: similar.slice(0, 6).map((artist, index) =>
          normalizeArtist({
            id: `lastfm-${(artist.name || "").toLowerCase().replace(/\s+/g, "-")}`,
            name: artist.name,
            imageUrl: artist.imageUrl || "",
            bio: artist.bio || "",
            tags: artist.tags || []
          })
        ),
        topTracks,
        albums: resolved.fixture
          ? albums.filter((album) => album.artistId === id).map(normalizeAlbum)
          : []
      }
    );
  });
}

export async function getArtistSimilar(id) {
  const resolved = resolveArtistId(id);
  if (!resolved) return null;
  const [lastfm, tastedive] = await Promise.all([
    getSimilarArtists(resolved.name),
    getTasteDiveSimilar(resolved.name)
  ]);
  return [...lastfm, ...tastedive].slice(0, 8);
}

export async function getArtistTopTracks(id) {
  const resolved = resolveArtistId(id);
  if (!resolved) return null;

  if (resolved.fixture) {
    return tracks.filter((track) => track.artistId === id).map(normalizeTrack);
  }

  // Fallback: search YouTube for this artist's songs
  const results = await searchYouTube(`${resolved.name} songs`, 10);
  return (results || []).map((yt) => normalizeTrack({
    id: yt.id,
    title: yt.title,
    artistName: yt.artistName || resolved.name,
    artworkUrl: yt.artworkUrl || "",
    durationMs: yt.durationMs || 0,
    videoId: yt.videoId || yt.id,
    availableProviders: ["youtube"],
    externalLinks: { youtube: `https://www.youtube.com/watch?v=${yt.videoId || yt.id}` }
  }));
}
