import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  PROVIDER_STATUSES,
  getProviderStatusSnapshot,
  recordProviderStatus,
  runProvider
} from "../src/services/providerHealth.service.js";

const app = createApp({ corsOrigin: "*" });

describe("provider health", () => {
  it("returns expanded provider status while preserving flat booleans", async () => {
    const response = await request(app).get("/api/providers/status").expect(200);

    expect(response.body).toMatchObject({
      youtube: false,
      jamendo: false,
      fallbackMode: true
    });
    expect(response.body.providers.youtube).toMatchObject({
      configured: false,
      status: PROVIDER_STATUSES.FALLBACK
    });
    expect(response.body.providers.itunes.mode).toBe("public-api");
  });

  it("records provider timeout status", async () => {
    await expect(
      runProvider("itunes", () => new Promise(() => {}), {
        mode: "public-api",
        timeoutMs: 1
      })
    ).rejects.toThrow(/timed out/i);

    expect(getProviderStatusSnapshot().providers.itunes.status).toBe(PROVIDER_STATUSES.TIMEOUT);
  });

  it("records fallback status explicitly", () => {
    recordProviderStatus("youtube", {
      configured: false,
      status: PROVIDER_STATUSES.FALLBACK,
      mode: "fixture",
      lastLatencyMs: 0,
      lastError: ""
    });

    expect(getProviderStatusSnapshot().providers.youtube).toMatchObject({
      status: PROVIDER_STATUSES.FALLBACK,
      mode: "fixture"
    });
  });
});
