import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

export async function getProviderLinks(track) {
  const youtube = track.externalLinks?.youtube || (track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : "");
  if (env.nodeEnv === "test" || track.mbid?.startsWith("fallback")) {
    return track.externalLinks || {};
  }
  if (!youtube) return track.externalLinks || {};

  const params = new URLSearchParams({
    url: youtube
  });
  const data = await safeFetchJson(`https://api.song.link/v1-alpha.1/links?${params}`);
  if (!data?.linksByPlatform) return track.externalLinks || {};

  return {
    spotify: data.linksByPlatform.spotify?.url || track.externalLinks?.spotify || "",
    apple: data.linksByPlatform.appleMusic?.url || track.externalLinks?.apple || "",
    youtube: data.linksByPlatform.youtube?.url || youtube,
    jiosaavn: track.externalLinks?.jiosaavn || "",
    deezer: data.linksByPlatform.deezer?.url || track.externalLinks?.deezer || ""
  };
}
