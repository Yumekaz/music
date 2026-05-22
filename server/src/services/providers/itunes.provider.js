import { env } from "../../config/env.js";
import { resolveFixtureTrack, searchFixtureTracks } from "../../data/fixtures.js";
import { safeFetchJson } from "../../utils/fetchJson.js";
import { cleanYoutubeTitleAndArtist, matchesTitleAndArtist } from "../../utils/normalize.js";
import { PROVIDER_STATUSES, recordProviderStatus } from "../providerHealth.service.js";


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

  const data = await safeFetchJson(`https://itunes.apple.com/search?${params}`, {
    providerName: "itunes",
    providerMode: "public-api",
    providerConfigured: true,
    timeoutMs: 7000
  });
  if (!data?.results?.length) {
    recordProviderStatus("itunes", {
      configured: true,
      mode: "fixture",
      status: PROVIDER_STATUSES.FALLBACK,
      lastLatencyMs: 0,
      lastError: ""
    });
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

export function superCleanTitle(title) {
  let s = title;
  // Remove all content inside parentheses and brackets
  s = s.replace(/\([^)]*\)/g, "");
  s = s.replace(/\[[^\]]*\]/g, "");
  // Remove quotes
  s = s.replace(/['"“”‘’]/g, "");
  // Remove common video suffixes / noise
  s = s.replace(/\b(?:official|video|audio|music|mv|m\/v|lyrics?|visualizer|hd|4k|hq)\b/gi, "");
  // Remove trailing/leading special chars and spaces
  s = s.replace(/^[ \-\|\/\~\:\,\.]+|[ \-\|\/\~\:\,\.]+$/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export async function getPreviewForTrack(title, artistName) {
  const cleaned = cleanYoutubeTitleAndArtist(title, artistName);
  const cleanTitle = cleaned.title;
  const cleanArtist = cleaned.artist;

  // Strategy 1: Cleaned title + Cleaned artist
  let results = await searchItunesPreview(`${cleanTitle} ${cleanArtist}`, 5);
  let match = results.find(
    (item) => matchesTitleAndArtist(item.title, item.artistName, title, artistName)
  );
  if (match) return match;

  // Strategy 2: Cleaned title alone (in case artist is a channel label like HYBE LABELS)
  if (cleanTitle) {
    results = await searchItunesPreview(cleanTitle, 5);
    match = results.find(
      (item) => matchesTitleAndArtist(item.title, item.artistName, title, artistName)
    );
    if (match) return match;
  }

  // Strategy 3: Super cleaned title alone
  const superCleaned = superCleanTitle(title);
  if (superCleaned && superCleaned !== cleanTitle) {
    results = await searchItunesPreview(superCleaned, 5);
    match = results.find(
      (item) => matchesTitleAndArtist(item.title, item.artistName, title, artistName)
    );
    if (match) return match;
  }

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
