import { afterEach, beforeEach } from "vitest";
import { clearMemoryCache } from "../src/utils/cache.js";

beforeEach(() => {
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  clearMemoryCache();
});
