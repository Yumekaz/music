import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp({ corsOrigin: "*" });

describe("api routes", () => {
  it("serves health with fallback status", async () => {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.providerStatus).toHaveProperty("fallbackMode");
  });

  it("searches seeded tracks without API keys", async () => {
    const response = await request(app).get("/api/search?q=kesariya").expect(200);
    expect(response.body.tracks[0]).toMatchObject({
      title: "Kesariya",
      artistName: "Arijit Singh"
    });
    expect(response.body.artists.length).toBeGreaterThan(0);
  });

  it("resolves a normalized track", async () => {
    const response = await request(app)
      .get("/api/tracks/resolve?title=Blinding%20Lights&artist=The%20Weeknd")
      .expect(200);

    expect(response.body).toMatchObject({
      id: "track-blinding-lights",
      videoId: "4NRXx6U8ABQ",
      lyricsAvailable: true
    });
    expect(response.body.externalLinks.youtube).toContain("youtube.com");
  });

  it("returns lyrics and availability", async () => {
    const lyrics = await request(app).get("/api/tracks/track-pasoori/lyrics").expect(200);
    const availability = await request(app).get("/api/tracks/track-pasoori/availability").expect(200);

    expect(lyrics.body.synced.length).toBeGreaterThan(0);
    expect(availability.body.links.youtube).toContain("youtube.com");
  });

  it("serves same-origin fallback preview audio", async () => {
    const response = await request(app).get("/api/audio/preview/track-kesariya").expect(200);

    expect(response.headers["content-type"]).toContain("audio/wav");
    expect(Number(response.headers["content-length"])).toBeGreaterThan(1000);
  });

  it("resolves dynamic lyrics using title and artist query params", async () => {
    const response = await request(app)
      .get("/api/tracks/dummy-id/lyrics?title=Kesariya&artist=Arijit%20Singh")
      .expect(200);

    expect(response.body.trackId).toBe("dummy-id");
    expect(response.body.plain).toContain("Kesariya");
  });
});
