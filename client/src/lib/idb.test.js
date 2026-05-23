import { describe, expect, it } from "vitest";
import {
  deleteLikedTrack,
  deletePlaylist,
  listLikedTracks,
  listPlaylists,
  putLikedTrack,
  savePlaylist
} from "./idb.js";

describe("IndexedDB library helpers", () => {
  it("persists liked tracks", async () => {
    await putLikedTrack({ id: "track-test", title: "Test Track" });
    const rows = await listLikedTracks();

    expect(rows.some((row) => row.id === "track-test")).toBe(true);

    await deleteLikedTrack("track-test");
  });

  it("persists playlists with tracks", async () => {
    const playlist = {
      id: "playlist-test",
      name: "Road Trip",
      tracks: [{ id: "song-test", title: "Test Song" }],
      createdAt: Date.now()
    };

    await savePlaylist(playlist);
    const rows = await listPlaylists();

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: playlist.id,
          name: playlist.name,
          tracks: playlist.tracks
        })
      ])
    );

    await deletePlaylist(playlist.id);
  });
});
