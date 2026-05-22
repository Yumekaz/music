import { env } from "../config/env.js";

export const PROVIDER_STATUSES = Object.freeze({
  OK: "ok",
  TIMEOUT: "timeout",
  ERROR: "error",
  DISABLED: "disabled",
  FALLBACK: "fallback",
  UNKNOWN: "unknown"
});

const runtimeStatus = new Map();

function nowIso() {
  return new Date().toISOString();
}

function getProviderDefinition(name) {
  const definitions = {
    youtube: {
      configured: Boolean(env.youtubeApiKey),
      status: env.youtubeApiKey ? PROVIDER_STATUSES.UNKNOWN : PROVIDER_STATUSES.FALLBACK,
      mode: env.youtubeApiKey ? "api" : env.nodeEnv === "test" ? "fixture" : "scraper"
    },
    itunes: {
      configured: true,
      status: PROVIDER_STATUSES.UNKNOWN,
      mode: "public-api"
    },
    jamendo: {
      configured: Boolean(env.jamendoClientId),
      status: env.jamendoClientId ? PROVIDER_STATUSES.UNKNOWN : PROVIDER_STATUSES.DISABLED,
      mode: "api"
    },
    lyrics: {
      configured: true,
      status: PROVIDER_STATUSES.UNKNOWN,
      mode: "lrclib"
    }
  };

  return definitions[name] || {
    configured: true,
    status: PROVIDER_STATUSES.UNKNOWN,
    mode: "api"
  };
}

export function getFlatProviderStatus() {
  return {
    youtube: Boolean(env.youtubeApiKey),
    lastfm: Boolean(env.lastfmApiKey),
    tastedive: Boolean(env.tastediveApiKey),
    jamendo: Boolean(env.jamendoClientId),
    redis: Boolean(env.upstashRedisRestUrl && env.upstashRedisRestToken),
    fallbackMode: !env.youtubeApiKey
  };
}

export function recordProviderStatus(name, patch = {}) {
  const definition = getProviderDefinition(name);
  const previous = runtimeStatus.get(name) || {};

  const next = {
    configured: patch.configured ?? previous.configured ?? definition.configured,
    status: patch.status || previous.status || definition.status,
    mode: patch.mode || previous.mode || definition.mode,
    lastLatencyMs: Number.isFinite(patch.lastLatencyMs)
      ? patch.lastLatencyMs
      : previous.lastLatencyMs || 0,
    lastError: patch.lastError ?? previous.lastError ?? "",
    lastCheckedAt: patch.lastCheckedAt || nowIso()
  };

  runtimeStatus.set(name, next);
  return next;
}

function timeoutError(timeoutMs) {
  const error = new Error(`Provider timed out after ${timeoutMs}ms`);
  error.name = "TimeoutError";
  return error;
}

function classifyProviderError(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return PROVIDER_STATUSES.TIMEOUT;
  }
  return PROVIDER_STATUSES.ERROR;
}

export async function runProvider(name, operation, options = {}) {
  const definition = getProviderDefinition(name);
  const configured = options.configured ?? definition.configured;
  const mode = options.mode || definition.mode;
  const timeoutMs = options.timeoutMs || 10000;
  const startedAt = Date.now();

  if (configured === false && options.skipWhenDisabled) {
    recordProviderStatus(name, {
      configured,
      mode,
      status: PROVIDER_STATUSES.DISABLED,
      lastLatencyMs: 0,
      lastError: ""
    });
    return options.disabledValue ?? null;
  }

  let timeoutId;
  try {
    const result = await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(timeoutError(timeoutMs)), timeoutMs);
      })
    ]);

    recordProviderStatus(name, {
      configured,
      mode,
      status: options.successStatus || PROVIDER_STATUSES.OK,
      lastLatencyMs: Date.now() - startedAt,
      lastError: ""
    });

    return result;
  } catch (error) {
    recordProviderStatus(name, {
      configured,
      mode,
      status: classifyProviderError(error),
      lastLatencyMs: Date.now() - startedAt,
      lastError: error?.message || String(error)
    });
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getProviderStatusSnapshot() {
  const providers = ["youtube", "itunes", "jamendo", "lyrics"].reduce((acc, name) => {
    const definition = getProviderDefinition(name);
    const runtime = runtimeStatus.get(name) || {};

    acc[name] = {
      configured: runtime.configured ?? definition.configured,
      status: runtime.status || definition.status,
      mode: runtime.mode || definition.mode,
      lastLatencyMs: runtime.lastLatencyMs || 0,
      lastError: runtime.lastError || "",
      lastCheckedAt: runtime.lastCheckedAt || ""
    };
    return acc;
  }, {});

  return {
    ...getFlatProviderStatus(),
    providers
  };
}

export function resetProviderStatusForTests() {
  runtimeStatus.clear();
}
