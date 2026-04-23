import { apiGet } from "./api.js";

export function getAlbum(id) {
  return apiGet(`/albums/${id}`);
}
