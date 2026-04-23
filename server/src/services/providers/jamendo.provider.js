import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function searchJamendo(query, limit = 5) {
  if (!env.jamendoClientId) return [];

  const params = new URLSearchParams({
    client_id: env.jamendoClientId,
    format: "json",
    search: query,
    limit: String(limit),
    include: "musicinfo",
    audioformat: "mp32"
  });
  const data = await safeFetchJson(`https://api.jamendo.com/v3.0/tracks/?${params}`);

  return (data?.results || []).map((track) => ({
    jamendoId: String(track.id),
    title: track.name,
    artistName: track.artist_name,
    albumName: track.album_name,
    durationMs: Number(track.duration || 0) * 1000,
    artworkUrl: track.album_image || track.image || "",
    previewUrl: track.audio || "",
    source: "jamendo"
  }));
}
