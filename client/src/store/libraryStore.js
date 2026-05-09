import { create } from "zustand";
import {
  addHistoryTrack,
  deleteLikedTrack,
  deletePlaylist as idbDeletePlaylist,
  listHistoryTracks,
  listLikedTracks,
  listPlaylists,
  putLikedTrack,
  savePlaylist
} from "../lib/idb.js";

export const useLibraryStore = create((set, get) => ({
  likedTracks: [],
  history: [],
  playlists: [],
  hydrated: false,
  hydrate: async () => {
    const [likedTracks, history, playlists] = await Promise.all([
      listLikedTracks(),
      listHistoryTracks(),
      listPlaylists()
    ]);
    set({ likedTracks, history, playlists, hydrated: true });
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
  }
}));
