import { Redis } from "@upstash/redis";
import { env } from "../config/env.js";

const memory = new Map();
let redisWarned = false;

function createRedis() {
  if (!env.upstashRedisRestUrl || !env.upstashRedisRestToken || env.nodeEnv === "test") {
    return null;
  }

  return new Redis({
    url: env.upstashRedisRestUrl,
    token: env.upstashRedisRestToken
  });
}

const redis = createRedis();

function readMemory(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function writeMemory(key, value, ttlSeconds) {
  memory.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function getCached(key) {
  if (redis) {
    try {
      return await redis.get(key);
    } catch (error) {
      if (!redisWarned) { console.warn("Redis unavailable, using in-memory cache"); redisWarned = true; }
    }
  }

  return readMemory(key);
}

export async function setCached(key, value, ttlSeconds) {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (error) {
      if (!redisWarned) { console.warn("Redis unavailable, using in-memory cache"); redisWarned = true; }
    }
  }

  writeMemory(key, value, ttlSeconds);
}

export async function getOrSetCached(key, ttlSeconds, factory) {
  const cached = await getCached(key);
  if (cached) return cached;

  const value = await factory();
  await setCached(key, value, ttlSeconds);
  return value;
}

export function clearMemoryCache() {
  memory.clear();
}
