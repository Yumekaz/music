import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function getTasteDiveSimilar(name) {
  if (!env.tastediveApiKey) return [];

  const params = new URLSearchParams({
    q: name,
    type: "music",
    info: "1",
    limit: "6",
    k: env.tastediveApiKey
  });
  const data = await safeFetchJson(`https://tastedive.com/api/similar?${params}`);
  return data?.Similar?.Results || [];
}
