import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
  lastfmApiKey: process.env.LASTFM_API_KEY || "",
  tastediveApiKey: process.env.TASTEDIVE_API_KEY || "",
  jamendoClientId: process.env.JAMENDO_CLIENT_ID || "",
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  musicBrainzUserAgent:
    process.env.MUSICBRAINZ_USER_AGENT || "MusicAppV3/1.0.0 (local@example.com)"
};

export function getProviderStatus() {
  return {
    youtube: Boolean(env.youtubeApiKey),
    lastfm: Boolean(env.lastfmApiKey),
    tastedive: Boolean(env.tastediveApiKey),
    jamendo: Boolean(env.jamendoClientId),
    redis: Boolean(env.upstashRedisRestUrl && env.upstashRedisRestToken),
    fallbackMode: !env.youtubeApiKey
  };
}
