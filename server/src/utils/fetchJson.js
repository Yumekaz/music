export async function fetchJson(url, options = {}) {
  const { timeoutMs = 6000, ...fetchOptions } = options;
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
  try {
    return await fetchJson(url, options);
  } catch {
    return null;
  }
}
