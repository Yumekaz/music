import { openDB } from "idb";

// Keep the legacy IndexedDB name so existing liked songs and playlists stay attached.
const DB_NAME = "music-app-v3";
const DB_VERSION = 2;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("likedTracks")) {
        database.createObjectStore("likedTracks", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("history")) {
        database.createObjectStore("history", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("playlists")) {
        database.createObjectStore("playlists", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("downloads")) {
        database.createObjectStore("downloads", { keyPath: "id" });
      }
    }
  });
}

export async function listLikedTracks() {
  return (await db()).getAll("likedTracks");
}

export async function putLikedTrack(track) {
  return (await db()).put("likedTracks", { ...track, likedAt: Date.now() });
}

export async function deleteLikedTrack(id) {
  return (await db()).delete("likedTracks", id);
}

export async function addHistoryTrack(track) {
  return (await db()).put("history", { ...track, playedAt: Date.now() });
}

export async function listHistoryTracks() {
  const rows = await (await db()).getAll("history");
  return rows.sort((a, b) => b.playedAt - a.playedAt);
}

export async function listPlaylists() {
  return (await db()).getAll("playlists");
}

export async function savePlaylist(playlist) {
  return (await db()).put("playlists", {
    ...playlist,
    updatedAt: Date.now()
  });
}

export async function deletePlaylist(id) {
  return (await db()).delete("playlists", id);
}

// ─── Offline Downloads Helper API ───

export async function getDownload(id) {
  return (await db()).get("downloads", id);
}

export async function putDownload(track, blob) {
  return (await db()).put("downloads", {
    id: track.id,
    title: track.title,
    artistName: track.artistName,
    durationMs: track.durationMs,
    artworkUrl: track.artworkUrl,
    previewUrl: track.previewUrl,
    jamendoUrl: track.jamendoUrl,
    sourceType: track.sourceType || "preview",
    blob,
    downloadedAt: Date.now()
  });
}

export async function deleteDownload(id) {
  return (await db()).delete("downloads", id);
}

export async function listDownloads() {
  return (await db()).getAll("downloads");
}
