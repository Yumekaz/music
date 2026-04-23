import { lyrics, resolveFixtureTrack } from "../../data/fixtures.js";
import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

function parseSyncedLyrics(value = "") {
  return value
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      return {
        timeMs: Math.round((minutes * 60 + seconds) * 1000),
        text: match[3].trim()
      };
    })
    .filter(Boolean);
}

export async function getLyricsFromLrclib(track) {
  const fallbackTrack = resolveFixtureTrack(track.title, track.artistName);
  const fallback = lyrics[fallbackTrack.id] || lyrics[track.id];

  if (env.nodeEnv === "test" || track.mbid?.startsWith("fallback")) {
    return {
      trackId: track.id,
      source: fallback?.source || "fallback-lrclib",
      plain: fallback?.plain || "",
      synced: fallback?.synced || [],
      cachedAt: new Date().toISOString()
    };
  }

  const params = new URLSearchParams({
    track_name: track.title,
    artist_name: track.artistName,
    album_name: track.albumName || "",
    duration: String(Math.round((track.durationMs || 0) / 1000))
  });

  const data = await safeFetchJson(`https://lrclib.net/api/get?${params}`, {
    headers: {
      "User-Agent": "MusicAppV3/1.0.0"
    }
  });

  if (data?.plainLyrics || data?.syncedLyrics) {
    return {
      trackId: track.id,
      source: "lrclib",
      plain: data.plainLyrics || "",
      synced: parseSyncedLyrics(data.syncedLyrics || ""),
      cachedAt: new Date().toISOString()
    };
  }

  return {
    trackId: track.id,
    source: fallback?.source || "fallback-lrclib",
    plain: fallback?.plain || "",
    synced: fallback?.synced || [],
    cachedAt: new Date().toISOString()
  };
}
