import { env } from "../../config/env.js";
import { artists, tracks } from "../../data/fixtures.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function getArtistInfo(name) {
  if (!env.lastfmApiKey) {
    return artists.find((artist) => artist.name.toLowerCase() === name.toLowerCase()) || null;
  }

  const params = new URLSearchParams({
    method: "artist.getinfo",
    artist: name,
    api_key: env.lastfmApiKey,
    format: "json"
  });
  const data = await safeFetchJson(`https://ws.audioscrobbler.com/2.0/?${params}`);
  const artist = data?.artist;
  if (!artist) return null;

  return {
    id: `lastfm-${artist.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: artist.name,
    imageUrl: artist.image?.at(-1)?.["#text"] || "",
    bio: artist.bio?.summary?.replace(/<[^>]+>/g, "") || "",
    tags: artist.tags?.tag?.map((tag) => tag.name).slice(0, 6) || [],
    mbid: artist.mbid || "",
    providerLinks: {
      lastfm: artist.url
    }
  };
}

export async function getSimilarArtists(name) {
  if (!env.lastfmApiKey) {
    return artists.filter((artist) => artist.name.toLowerCase() !== name.toLowerCase()).slice(0, 6);
  }

  const params = new URLSearchParams({
    method: "artist.getsimilar",
    artist: name,
    api_key: env.lastfmApiKey,
    format: "json",
    limit: "6"
  });
  const data = await safeFetchJson(`https://ws.audioscrobbler.com/2.0/?${params}`);
  return data?.similarartists?.artist || [];
}

export async function getTopTracks() {
  if (!env.lastfmApiKey) return tracks;

  const params = new URLSearchParams({
    method: "chart.gettoptracks",
    api_key: env.lastfmApiKey,
    format: "json",
    limit: "12"
  });
  const data = await safeFetchJson(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!data?.tracks?.track?.length) return tracks;

  return data.tracks.track.map((track, index) => ({
    id: `lastfm-${index}-${track.name.toLowerCase().replace(/\s+/g, "-")}`,
    title: track.name,
    artistName: track.artist?.name || "",
    artworkUrl: track.image?.at(-1)?.["#text"] || "",
    externalLinks: {
      lastfm: track.url
    }
  }));
}
