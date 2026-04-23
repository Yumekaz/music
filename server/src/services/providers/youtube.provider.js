import { env } from "../../config/env.js";
import { searchFixtureTracks, tracks } from "../../data/fixtures.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

function parseIsoDuration(value = "PT0S") {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, hours = 0, minutes = 0, seconds = 0] = match.map((part) => Number(part || 0));
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function fallbackResult(track) {
  return {
    id: track.id,
    videoId: track.videoId,
    title: track.title,
    artistName: track.artistName,
    durationMs: track.durationMs,
    artworkUrl: track.artworkUrl,
    viewCount: track.popularity * 1000000,
    source: "fallback-youtube"
  };
}

export async function searchYouTube(query, limit = 8) {
  if (!env.youtubeApiKey) {
    return searchFixtureTracks(query, limit).map(fallbackResult);
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: `${query} song official audio`,
    type: "video",
    videoCategoryId: "10",
    maxResults: String(limit),
    key: env.youtubeApiKey
  });

  const search = await safeFetchJson(`https://www.googleapis.com/youtube/v3/search?${params}`);
  const ids = search?.items?.map((item) => item.id?.videoId).filter(Boolean) || [];
  if (!ids.length) return searchFixtureTracks(query, limit).map(fallbackResult);

  const detailParams = new URLSearchParams({
    part: "contentDetails,statistics",
    id: ids.join(","),
    key: env.youtubeApiKey
  });
  const details = await safeFetchJson(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
  const detailById = new Map((details?.items || []).map((item) => [item.id, item]));

  return search.items.map((item) => {
    const videoId = item.id.videoId;
    const detail = detailById.get(videoId);
    return {
      id: `youtube-${videoId}`,
      videoId,
      title: item.snippet.title,
      artistName: item.snippet.channelTitle,
      durationMs: parseIsoDuration(detail?.contentDetails?.duration),
      artworkUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
      viewCount: Number(detail?.statistics?.viewCount || 0),
      source: "youtube"
    };
  });
}

export async function getTrendingMusic(regionCode = "IN", limit = 8) {
  if (!env.youtubeApiKey) {
    return tracks.slice(0, limit).map(fallbackResult);
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode,
    videoCategoryId: "10",
    maxResults: String(limit),
    key: env.youtubeApiKey
  });

  const data = await safeFetchJson(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!data?.items?.length) return tracks.slice(0, limit).map(fallbackResult);

  return data.items.map((item) => ({
    id: `youtube-${item.id}`,
    videoId: item.id,
    title: item.snippet.title,
    artistName: item.snippet.channelTitle,
    durationMs: parseIsoDuration(item.contentDetails?.duration),
    artworkUrl: item.snippet.thumbnails?.high?.url || "",
    viewCount: Number(item.statistics?.viewCount || 0),
    source: "youtube"
  }));
}
