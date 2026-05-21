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

async function scrapeYouTube(query, limit = 8) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' song official audio')}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    let data = null;

    const regex = /ytInitialData\s*=\s*({.+?});/;
    const match = html.match(regex);
    if (match) {
      data = JSON.parse(match[1]);
    } else {
      const startIndex = html.indexOf('var ytInitialData =');
      if (startIndex !== -1) {
        const dataStr = html.substring(startIndex);
        const endOfScript = dataStr.indexOf(';</script>');
        if (endOfScript !== -1) {
          const jsonStr = dataStr.substring('var ytInitialData ='.length, endOfScript).trim();
          data = JSON.parse(jsonStr);
        }
      }
    }

    if (!data) return [];

    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return [];

    const videoList = [];
    for (const item of contents) {
      const itemSection = item.itemSectionRenderer;
      if (itemSection?.contents) {
        for (const content of itemSection.contents) {
          if (content.videoRenderer) {
            const video = content.videoRenderer;
            const videoId = video.videoId;
            if (!videoId) continue;
            
            const title = video.title?.runs?.[0]?.text || "";
            const channelName = video.ownerText?.runs?.[0]?.text || "";
            const durationStr = video.lengthText?.simpleText || "";
            const artworkUrl = video.thumbnail?.thumbnails?.[0]?.url || "";

            // Parse duration e.g. "3:45" or "1:12:30"
            let durationMs = 0;
            if (durationStr) {
              const parts = durationStr.split(':').map(Number);
              if (!parts.some(isNaN)) {
                if (parts.length === 2) {
                  durationMs = (parts[0] * 60 + parts[1]) * 1000;
                } else if (parts.length === 3) {
                  durationMs = ((parts[0] * 60 + parts[1]) * 60 + parts[2]) * 1000;
                }
              }
            }

            videoList.push({
              id: `youtube-${videoId}`,
              videoId,
              title,
              artistName: channelName,
              durationMs,
              artworkUrl,
              viewCount: 0,
              source: "youtube"
            });

            if (videoList.length >= limit) {
              break;
            }
          }
        }
      }
      if (videoList.length >= limit) {
        break;
      }
    }

    return videoList;
  } catch (error) {
    console.error("scrapeYouTube failed:", error);
    return [];
  }
}

export async function searchYouTube(query, limit = 8) {
  if (!env.youtubeApiKey) {
    const scraped = await scrapeYouTube(query, limit);
    if (scraped.length > 0) return scraped;
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
  
  if (!ids.length) {
    // API failed or returned empty results (e.g. 403 Forbidden). Try to scrape instead!
    const scraped = await scrapeYouTube(query, limit);
    if (scraped.length > 0) return scraped;
    return searchFixtureTracks(query, limit).map(fallbackResult);
  }

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
