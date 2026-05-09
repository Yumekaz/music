import { apiGet, apiPost } from "./api.js";

export function searchCatalog(query, limit = 10) {
  return apiGet("/search", { q: query, limit });
}

export function getTrending() {
  return apiGet("/discovery/trending");
}

export function getCharts() {
  return apiGet("/discovery/charts");
}

export function getRecommendations(artists) {
  return apiPost("/discovery/recommendations", { artists });
}
