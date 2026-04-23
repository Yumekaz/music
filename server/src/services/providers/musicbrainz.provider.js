import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function searchMusicBrainzRecording(title, artistName) {
  if (env.nodeEnv === "test") return null;

  const query = `recording:"${title}" AND artist:"${artistName}"`;
  const params = new URLSearchParams({
    query,
    fmt: "json",
    limit: "5"
  });

  const data = await safeFetchJson(`https://musicbrainz.org/ws/2/recording?${params}`, {
    headers: {
      "User-Agent": env.musicBrainzUserAgent
    },
    timeoutMs: 7000
  });

  const recording = data?.recordings?.[0];
  if (!recording) return null;

  return {
    mbid: recording.id,
    title: recording.title,
    artistName: recording["artist-credit"]?.map((credit) => credit.name).join(" ") || artistName,
    durationMs: Number(recording.length || 0),
    albumName: recording.releases?.[0]?.title || ""
  };
}

export async function getMusicBrainzAlbum(id) {
  const data = await safeFetchJson(
    `https://musicbrainz.org/ws/2/release/${encodeURIComponent(id)}?inc=recordings&fmt=json`,
    {
      headers: {
        "User-Agent": env.musicBrainzUserAgent
      }
    }
  );
  return data || null;
}
