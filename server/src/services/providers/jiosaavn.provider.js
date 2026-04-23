import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function searchJioSaavn(query) {
  if (env.nodeEnv === "test") return null;

  const params = new URLSearchParams({ query });
  const data = await safeFetchJson(`https://saavn.dev/api/search/songs?${params}`, {
    timeoutMs: 5000
  });
  const item = data?.data?.results?.[0];
  if (!item) return null;

  return {
    title: item.name,
    artistName: item.primaryArtists,
    albumName: item.album?.name || "",
    artworkUrl: item.image?.at(-1)?.url || "",
    externalLinks: {
      jiosaavn: item.url || ""
    },
    source: "jiosaavn"
  };
}
