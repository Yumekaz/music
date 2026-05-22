import { afterEach, beforeEach } from "vitest";

const providerEnvKeys = [
  "YOUTUBE_API_KEY",
  "LASTFM_API_KEY",
  "TASTEDIVE_API_KEY",
  "JAMENDO_CLIENT_ID",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
];

function forceFallbackMode() {
  process.env.NODE_ENV = "test";
  for (const key of providerEnvKeys) {
    process.env[key] = "";
  }
}

forceFallbackMode();

beforeEach(() => {
  forceFallbackMode();
});

afterEach(async () => {
  const { clearMemoryCache } = await import("../src/utils/cache.js");
  const { resetProviderStatusForTests } = await import("../src/services/providerHealth.service.js");
  clearMemoryCache();
  resetProviderStatusForTests();
});
