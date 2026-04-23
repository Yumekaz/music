import { apiGet } from "./api.js";

export function getTrack(id) {
  return apiGet(`/tracks/${id}`);
}

export function resolveTrack(title, artist) {
  return apiGet("/tracks/resolve", { title, artist });
}

export function getAvailability(id) {
  return apiGet(`/tracks/${id}/availability`);
}
