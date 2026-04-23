import { albums, findArtistById, tracks } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeAlbum, normalizeArtist, normalizeTrack } from "../utils/normalize.js";
import { getArtistInfo, getSimilarArtists } from "./providers/lastfm.provider.js";
import { getTasteDiveSimilar } from "./providers/tastedive.provider.js";
import { getAudioDbArtist } from "./providers/theaudiodb.provider.js";

export async function getArtistProfile(id) {
  const fixture = findArtistById(id);
  if (!fixture) return null;

  return getOrSetCached(`artist:${id}`, 24 * 60 * 60, async () => {
    const [lastfm, audioDb, similar] = await Promise.all([
      getArtistInfo(fixture.name),
      getAudioDbArtist(fixture.name),
      getSimilarArtists(fixture.name)
    ]);

    return normalizeArtist(
      {
        ...fixture,
        ...lastfm,
        imageUrl: audioDb?.imageUrl || lastfm?.imageUrl || fixture.imageUrl,
        bio: audioDb?.bio || lastfm?.bio || fixture.bio
      },
      {
        similarArtists: similar.slice(0, 6).map((artist, index) =>
          normalizeArtist({
            id: artist.id || `similar-${id}-${index}`,
            name: artist.name,
            imageUrl: artist.imageUrl || "",
            bio: artist.bio || "",
            tags: artist.tags || []
          })
        ),
        topTracks: tracks.filter((track) => track.artistId === id).map(normalizeTrack),
        albums: albums.filter((album) => album.artistId === id).map(normalizeAlbum)
      }
    );
  });
}

export async function getArtistSimilar(id) {
  const artist = findArtistById(id);
  if (!artist) return null;
  const [lastfm, tastedive] = await Promise.all([getSimilarArtists(artist.name), getTasteDiveSimilar(artist.name)]);
  return [...lastfm, ...tastedive].slice(0, 8);
}

export async function getArtistTopTracks(id) {
  if (!findArtistById(id)) return null;
  return tracks.filter((track) => track.artistId === id).map(normalizeTrack);
}
