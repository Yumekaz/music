import { apiGet } from "./api.js";

export function getLyrics(trackId, title, artist) {
  const params = new URLSearchParams();
  if (title) params.append("title", title);
  if (artist) params.append("artist", artist);
  const queryString = params.toString();
  return apiGet(`/tracks/${trackId}/lyrics${queryString ? `?${queryString}` : ""}`);
}
