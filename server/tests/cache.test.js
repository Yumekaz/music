import { describe, expect, it, vi } from "vitest";
import { getOrSetCached } from "../src/utils/cache.js";

describe("cache", () => {
  it("deduplicates values inside the TTL window", async () => {
    const factory = vi.fn(async () => ({ ok: true }));

    await getOrSetCached("cache-test", 30, factory);
    await getOrSetCached("cache-test", 30, factory);

    expect(factory).toHaveBeenCalledTimes(1);
  });
});
