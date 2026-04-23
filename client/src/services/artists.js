import { apiGet } from "./api.js";

export function getArtist(id) {
  return apiGet(`/artists/${id}`);
}

export function getArtistTopTracks(id) {
  return apiGet(`/artists/${id}/top-tracks`);
}
