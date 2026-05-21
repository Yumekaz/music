import { env } from "../../config/env.js";
import { resolveFixtureTrack, searchFixtureTracks } from "../../data/fixtures.js";
import { safeFetchJson } from "../../utils/fetchJson.js";
import { cleanYoutubeTitleAndArtist, matchesTitleAndArtist } from "../../utils/normalize.js";


export async function searchItunesPreview(query, limit = 5) {
  if (env.nodeEnv === "test") {
    return searchFixtureTracks(query, limit).map((track) => ({
      title: track.title,
      artistName: track.artistName,
      previewUrl: track.previewUrl,
      durationMs: track.durationMs,
      source: "fallback-itunes"
    }));
  }

  const params = new URLSearchParams({
    term: query,
    entity: "song",
    limit: String(limit)
  });

  const data = await safeFetchJson(`https://itunes.apple.com/search?${params}`);
  if (!data?.results?.length) {
    return searchFixtureTracks(query, limit).map((track) => ({
      title: track.title,
      artistName: track.artistName,
      previewUrl: track.previewUrl,
      durationMs: track.durationMs,
      source: "fallback-itunes"
    }));
  }

  return data.results.map((item) => ({
    title: item.trackName,
    artistName: item.artistName,
    albumName: item.collectionName,
    previewUrl: item.previewUrl || "",
    durationMs: item.trackTimeMillis || 0,
    artworkUrl: item.artworkUrl100?.replace("100x100bb", "600x600bb") || "",
    source: "itunes"
  }));
}

export async function getPreviewForTrack(title, artistName) {
  const cleaned = cleanYoutubeTitleAndArtist(title, artistName);
  const cleanTitle = cleaned.title;
  const cleanArtist = cleaned.artist;

  const results = await searchItunesPreview(`${cleanTitle} ${cleanArtist}`, 5);

  const match = results.find(
    (item) => matchesTitleAndArtist(item.title, item.artistName, title, artistName)
  );

  if (match) return match;

  // Only fall back to fixtures if the query actually matches one of them
  const isFixtureQuery = ["blinding lights", "kesariya", "pasoori"].some((name) =>
    title.toLowerCase().includes(name)
  );
  if (isFixtureQuery) {
    return {
      ...resolveFixtureTrack(title, artistName),
      source: "fallback-itunes"
    };
  }

  return null;
}
