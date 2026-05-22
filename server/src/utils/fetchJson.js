import { runProvider } from "../services/providerHealth.service.js";

export async function fetchJson(url, options = {}) {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed ${response.status} for ${url}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function safeFetchJson(url, options = {}) {
  const {
    providerName,
    providerMode,
    providerConfigured,
    providerSuccessStatus,
    ...fetchOptions
  } = options;

  try {
    if (providerName) {
      return await runProvider(
        providerName,
        () => fetchJson(url, fetchOptions),
        {
          mode: providerMode,
          configured: providerConfigured,
          successStatus: providerSuccessStatus,
          timeoutMs: fetchOptions.timeoutMs
        }
      );
    }

    return await fetchJson(url, fetchOptions);
  } catch (error) {
    console.error("safeFetchJson failed for URL:", url, error);
    return null;
  }
}
