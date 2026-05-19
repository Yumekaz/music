import { create } from "zustand";
import {
  addHistoryTrack,
  deleteLikedTrack,
  deletePlaylist as idbDeletePlaylist,
  listHistoryTracks,
  listLikedTracks,
  listPlaylists,
  putLikedTrack,
  savePlaylist,
  listDownloads,
  putDownload,
  deleteDownload
} from "../lib/idb.js";

export const useLibraryStore = create((set, get) => ({
  likedTracks: [],
  history: [],
  playlists: [],
  downloads: [],
  hydrated: false,
  hydrate: async () => {
    const [likedTracks, history, playlists, downloads] = await Promise.all([
      listLikedTracks(),
      listHistoryTracks(),
      listPlaylists(),
      listDownloads()
    ]);
    set({ likedTracks, history, playlists, downloads, hydrated: true });
  },
  isLiked: (id) => get().likedTracks.some((track) => track.id === id),
  toggleLike: async (track) => {
    if (get().isLiked(track.id)) {
      await deleteLikedTrack(track.id);
      set((state) => ({ likedTracks: state.likedTracks.filter((item) => item.id !== track.id) }));
      return false;
    }

    await putLikedTrack(track);
    set((state) => ({ likedTracks: [{ ...track, likedAt: Date.now() }, ...state.likedTracks] }));
    return true;
  },
  recordHistory: async (track) => {
    await addHistoryTrack(track);
    const history = await listHistoryTracks();
    set({ history });
  },
  savePlaylist: async (playlist) => {
    await savePlaylist(playlist);
    set({ playlists: await listPlaylists() });
  },
  deletePlaylist: async (id) => {
    await idbDeletePlaylist(id);
    set({ playlists: await listPlaylists() });
  },
  addToPlaylist: async (playlistId, track) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const exists = (playlist.tracks || []).some((t) => t.id === track.id);
    if (exists) return;
    await savePlaylist({
      ...playlist,
      tracks: [...(playlist.tracks || []), track]
    });
    set({ playlists: await listPlaylists() });
  },
  removeFromPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    await savePlaylist({
      ...playlist,
      tracks: (playlist.tracks || []).filter((t) => t.id !== trackId)
    });
    set({ playlists: await listPlaylists() });
  },
  isDownloaded: (id) => get().downloads.some((track) => track.id === id),
  downloadTrack: async (track) => {
    const url = track.jamendoUrl || track.previewUrl;
    if (!url) throw new Error("Track has no audio URL for download.");
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch audio stream.");
    const blob = await res.blob();
    
    await putDownload(track, blob);
    const downloads = await listDownloads();
    set({ downloads });
  },
  removeDownload: async (id) => {
    await deleteDownload(id);
    const downloads = await listDownloads();
    set({ downloads });
  }
}));
