import { apiGet } from "./api.js";

export function getProviderStatus() {
  return apiGet("/providers/status");
}
