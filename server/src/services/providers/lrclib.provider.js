import { lyrics, resolveFixtureTrack } from "../../data/fixtures.js";
import { env } from "../../config/env.js";
import { safeFetchJson } from "../../utils/fetchJson.js";

function parseSyncedLyrics(value = "") {
  return value
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      return {
        timeMs: Math.round((minutes * 60 + seconds) * 1000),
        text: match[3].trim()
      };
    })
    .filter(Boolean);
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseYoutubeTitle(videoTitle, channelTitle) {
  const decodedTitle = decodeHtmlEntities(videoTitle || "");
  const decodedChannel = decodeHtmlEntities(channelTitle || "");

  let artist = decodedChannel;
  let title = decodedTitle;

  // Check if the video title contains " - "
  if (decodedTitle.includes(" - ")) {
    const parts = decodedTitle.split(" - ");
    const artistPart = parts[0].trim();
    const titlePart = parts.slice(1).join(" - ").trim();
    
    if (artistPart && titlePart) {
      artist = artistPart;
      title = titlePart;
    }
  }

  // Clean title (remove suffixes like (Official Video), (Lyrics), feat. etc)
  let cleanTitle = title
    .replace(/\(Official\s+(Video|Audio|Music\s+Video|Lyric\s+Video|Lyrics|Visualizer)\)/gi, "")
    .replace(/\[Official\s+(Video|Audio|Music\s+Video|Lyric\s+Video|Lyrics|Visualizer)\]/gi, "")
    .replace(/\(Music\s+Video\)/gi, "")
    .replace(/\[Music\s+Video\]/gi, "")
    .replace(/\(Lyrics\)/gi, "")
    .replace(/\[Lyrics\]/gi, "")
    .replace(/\(Visualizer\)/gi, "")
    .replace(/\[Visualizer\]/gi, "")
    .replace(/\(Official\s+Lyric\s+Video\)/gi, "")
    .replace(/\[Official\s+Lyric\s+Video\]/gi, "")
    .trim();

  // Clean artist: remove VEVO or Topic suffixes
  let cleanArtist = artist
    .replace(/VEVO$/i, "")
    .replace(/- Topic$/i, "")
    .trim();

  // Split by comma or common separator to get primary artist for search fallback
  let primaryArtist = cleanArtist;
  const artistFeatMatch = cleanArtist.match(/^(.*?)(?:\s+(?:feat\.?|ft\.?|&|,|and)\s+)/i);
  if (artistFeatMatch && artistFeatMatch[1]) {
    primaryArtist = artistFeatMatch[1].trim();
  }

  return {
    title: cleanTitle,
    artist: cleanArtist,
    primaryArtist: primaryArtist
  };
}

function lrclibOptions() {
  return {
    providerName: "lyrics",
    providerMode: "lrclib",
    providerConfigured: true,
    timeoutMs: 7000,
    headers: {
      "User-Agent": "MusicAppV3/1.0.0"
    }
  };
}

export async function getLyricsFromLrclib(track) {
  console.log("[lrclib] input track:", JSON.stringify(track));
  const fallbackTrack = resolveFixtureTrack(track.title, track.artistName);
  const fallback = lyrics[fallbackTrack.id] || lyrics[track.id];

  if (env.nodeEnv === "test" || track.mbid?.startsWith("fallback")) {
    console.log("[lrclib] Using fallback for track ID:", track.id);
    return {
      trackId: track.id,
      source: fallback?.source || "fallback-lrclib",
      plain: fallback?.plain || "",
      synced: fallback?.synced || [],
      cachedAt: new Date().toISOString()
    };
  }

  const parsed = parseYoutubeTitle(track.title, track.artistName);
  console.log("[lrclib] parsed title/artist:", JSON.stringify(parsed));

  // 1. Construct parameters for exact matching lookup
  const params = new URLSearchParams({
    track_name: parsed.title,
    artist_name: parsed.primaryArtist,
    album_name: track.albumName || ""
  });
  if (track.durationMs && track.durationMs > 0) {
    params.append("duration", String(Math.round(track.durationMs / 1000)));
  }

  console.log("[lrclib] Exact match 1 URL: https://lrclib.net/api/get?" + params.toString());
  let data = await safeFetchJson(`https://lrclib.net/api/get?${params}`, lrclibOptions());
  console.log("[lrclib] Exact match 1 result exists:", !!data, "syncedLyrics:", !!data?.syncedLyrics);

  // If that fails, try with the full clean artist name
  if (!data?.plainLyrics && !data?.syncedLyrics && parsed.artist !== parsed.primaryArtist) {
    const paramsFull = new URLSearchParams({
      track_name: parsed.title,
      artist_name: parsed.artist,
      album_name: track.albumName || ""
    });
    if (track.durationMs && track.durationMs > 0) {
      paramsFull.append("duration", String(Math.round(track.durationMs / 1000)));
    }
    data = await safeFetchJson(`https://lrclib.net/api/get?${paramsFull}`, lrclibOptions());
  }

  // 2. Fall back to fuzzy searching if exact match fails
  if (!data?.plainLyrics && !data?.syncedLyrics) {
    console.log("[lrclib] Exact match failed. Falling back to fuzzy search...");
    // Attempt 1: search with clean title + clean artist
    let searchQuery = `${parsed.title} ${parsed.artist}`;
    let searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
    console.log("[lrclib] Fuzzy Attempt 1 URL:", searchUrl);
    let searchResults = await safeFetchJson(searchUrl, lrclibOptions());
    console.log("[lrclib] Fuzzy Attempt 1 results count:", searchResults?.length);

    // Attempt 2: if no results, search with clean title + primary artist
    if ((!searchResults || !searchResults.length) && parsed.artist !== parsed.primaryArtist) {
      searchQuery = `${parsed.title} ${parsed.primaryArtist}`;
      searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
      console.log("[lrclib] Fuzzy Attempt 2 URL:", searchUrl);
      searchResults = await safeFetchJson(searchUrl, lrclibOptions());
      console.log("[lrclib] Fuzzy Attempt 2 results count:", searchResults?.length);
    }

    // Attempt 3: if no results, search with just the clean title
    if ((!searchResults || !searchResults.length) && parsed.title) {
      searchQuery = parsed.title;
      searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
      console.log("[lrclib] Fuzzy Attempt 3 URL:", searchUrl);
      searchResults = await safeFetchJson(searchUrl, lrclibOptions());
      console.log("[lrclib] Fuzzy Attempt 3 results count:", searchResults?.length);
    }

    if (searchResults && searchResults.length > 0) {
      // Find the first result containing lyrics
      console.log("[lrclib] First fuzzy result:", JSON.stringify(searchResults[0]));
      const match = searchResults.find((r) => r.plainLyrics || r.syncedLyrics);
      if (match) {
        console.log("[lrclib] Found match in fuzzy search. Has synced:", !!match.syncedLyrics);
        data = {
          plainLyrics: match.plainLyrics,
          syncedLyrics: match.syncedLyrics
        };
      } else {
        console.log("[lrclib] No result had lyrics in searchResults.");
      }
    }
  }

  if (data?.plainLyrics || data?.syncedLyrics) {
    return {
      trackId: track.id,
      source: "lrclib",
      plain: data.plainLyrics || "",
      synced: parseSyncedLyrics(data.syncedLyrics || ""),
      cachedAt: new Date().toISOString()
    };
  }

  return {
    trackId: track.id,
    source: fallback?.source || "fallback-lrclib",
    plain: fallback?.plain || "",
    synced: fallback?.synced || [],
    cachedAt: new Date().toISOString()
  };
}
