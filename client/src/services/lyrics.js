import { apiGet } from "./api.js";

export function getLyrics(trackId) {
  return apiGet(`/tracks/${trackId}/lyrics`);
}
