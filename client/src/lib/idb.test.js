import { describe, expect, it } from "vitest";
import { deleteLikedTrack, listLikedTracks, putLikedTrack } from "./idb.js";

describe("IndexedDB library helpers", () => {
  it("persists liked tracks", async () => {
    await putLikedTrack({ id: "track-test", title: "Test Track" });
    const rows = await listLikedTracks();

    expect(rows.some((row) => row.id === "track-test")).toBe(true);

    await deleteLikedTrack("track-test");
  });
});
