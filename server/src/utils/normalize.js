export function normalizeTrack(track, overrides = {}) {
  return {
    id: track.id,
    videoId: track.videoId || "",
    previewUrl: track.previewUrl || "",
    jamendoUrl: track.jamendoUrl || "",
    jamendoId: track.jamendoId || "",
    title: track.title,
    artistName: track.artistName,
    artistId: track.artistId || "",
    albumName: track.albumName || "",
    albumId: track.albumId || "",
    durationMs: Number(track.durationMs || 0),
    artworkUrl: track.artworkUrl || "",
    mbid: track.mbid || "",
    lyricsAvailable: Boolean(track.lyricsAvailable),
    availableProviders: track.availableProviders || [],
    externalLinks: {
      spotify: "",
      apple: "",
      youtube: track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : "",
      jiosaavn: "",
      deezer: "",
      ...(track.externalLinks || {})
    },
    ...overrides
  };
}

export function normalizeArtist(artist, overrides = {}) {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl || "",
    bio: artist.bio || "",
    tags: artist.tags || [],
    similarArtists: artist.similarArtists || [],
    topTracks: artist.topTracks || [],
    mbid: artist.mbid || "",
    providerLinks: artist.providerLinks || {},
    ...overrides
  };
}

export function normalizeAlbum(album, overrides = {}) {
  return {
    id: album.id,
    title: album.title,
    artistId: album.artistId || "",
    artistName: album.artistName || "",
    releaseDate: album.releaseDate || "",
    artworkUrl: album.artworkUrl || "",
    mbid: album.mbid || "",
    tracks: album.tracks || [],
    ...overrides
  };
}

export function normalizeTerm(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanYoutubeTitleAndArtist(videoTitle, channelTitle) {
  if (!videoTitle) return { title: "", artist: "" };

  // If there's a '|', take the first part since everything after is usually tags/cast/labels
  let cleanTitle = videoTitle.split("|")[0].trim();

  // 1. Remove common bracketed noise
  const noisePatterns = [
    /\((?:official\s+)?(?:video|audio|music\s+video|lyric|lyrics|lyrical|visualizer|live|acoustic|clip|performance|studio\s+version|remix|hd|4k|hq|1080p|clean\s+version)\)/gi,
    /\[(?:official\s+)?(?:video|audio|music\s+video|lyric|lyrics|lyrical|visualizer|live|acoustic|clip|performance|studio\s+version|remix|hd|4k|hq|1080p|clean\s+version)\]/gi,
    /\((?:feat|ft|featuring|prod)\.?\s+[^)]+\)/gi,
    /\[(?:feat|ft|featuring|prod)\.?\s+[^\]]+\]/gi,
    /\([^)]*?\b(?:official|lyrics?|video|audio|music|record|release|remastered|version|edit)\b[^)]*?\)/gi,
    /\[[^\]]*?\b(?:official|lyrics?|video|audio|music|record|release|remastered|version|edit)\b[^\]]*?\]/gi
  ];

  noisePatterns.forEach((pattern) => {
    cleanTitle = cleanTitle.replace(pattern, "");
  });

  // Remove standalone noise words/phrases
  const standaloneNoise = [
    /\b(?:official\s+)?(?:music\s+)?video\b/gi,
    /\b(?:official\s+)?audio\b/gi,
    /\blyrics?\b/gi,
    /\blyrical\b/gi,
    /\bvisualizer\b/gi,
    /\bhd\b/gi,
    /\b4k\b/gi,
    /\bhq\b/gi,
    /-\s*(?:official\s*)?(?:music\s*)?(?:video|audio)/gi
  ];

  standaloneNoise.forEach((pattern) => {
    cleanTitle = cleanTitle.replace(pattern, "");
  });

  // Clean HTML entities
  cleanTitle = cleanTitle
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  let artist = (channelTitle || "").trim();
  let title = cleanTitle.trim();

  // 2. Split if there is a separator
  const separators = [" - ", " : ", " ~ ", " – ", " — "];
  let splitIndex = -1;
  let separatorUsed = "";
  for (const sep of separators) {
    const idx = cleanTitle.indexOf(sep);
    if (idx !== -1) {
      splitIndex = idx;
      separatorUsed = sep;
      break;
    }
  }

  if (splitIndex !== -1) {
    const part1 = cleanTitle.substring(0, splitIndex).trim();
    const part2 = cleanTitle.substring(splitIndex + separatorUsed.length).trim();

    // Check which part is more likely the artist.
    const normChannel = artist.toLowerCase().replace(/vevo/g, "").replace(/[^a-z0-9]/g, "");
    const normPart1 = part1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normPart2 = part2.toLowerCase().replace(/[^a-z0-9]/g, "");

    // If channel title matches part2, part2 is artist, part1 is title
    if (normPart2 && normChannel && (normChannel.includes(normPart2) || normPart2.includes(normChannel))) {
      artist = part2;
      title = part1;
    } else {
      // Default: part1 is artist, part2 is title
      artist = part1;
      title = part2;
    }
  }

  // Clean up any trailing/leading dashes, pipes, spaces
  title = title.replace(/^[\s\-\|\/\~]+|[\s\-\|\/\~]+$/g, "").trim();
  artist = artist.replace(/^[\s\-\|\/\~]+|[\s\-\|\/\~]+$/g, "").trim();

  // Remove trailing "vevo" from artist name
  artist = artist.replace(/\bvevo\b/gi, "").trim();

  if (!title) title = videoTitle;
  if (!artist) artist = channelTitle || "Unknown Artist";

  return { title, artist };
}

export function matchesTitleAndArtist(candidateTitle, candidateArtist, targetTitle, targetArtist) {
  const normCandTitle = normalizeTerm(candidateTitle);
  const normCandArtist = normalizeTerm(candidateArtist);
  
  const normTargetTitle = normalizeTerm(targetTitle);
  const normTargetArtist = normalizeTerm(targetArtist);

  if (
    (normCandTitle.includes(normTargetTitle) || normTargetTitle.includes(normCandTitle)) &&
    (normCandArtist.includes(normTargetArtist) || normTargetArtist.includes(normCandArtist))
  ) {
    return true;
  }

  const getWords = (str) =>
    str
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["official", "video", "audio", "lyrics", "music"].includes(w));

  const candTitleWords = getWords(normCandTitle);
  const candArtistWords = getWords(normCandArtist);
  const targetTitleWords = getWords(normTargetTitle);
  const targetArtistWords = getWords(normTargetArtist);

  const hasTitleOverlap = candTitleWords.some((w) => targetTitleWords.includes(w) || normTargetTitle.includes(w));
  
  const isLabel = /\b(?:music|records|series|company|studios|entertainment|official|channel|vevo|sound|tseries|yrf|shemaroo|tips|saregama|speed|aditya|hungama)\b/i.test(targetArtist);

  const hasArtistOverlap = candArtistWords.some(
    (w) => targetArtistWords.includes(w) || normTargetArtist.includes(w) || normTargetTitle.includes(w)
  ) || (isLabel && normTargetTitle.includes(normCandTitle));

  return hasTitleOverlap && hasArtistOverlap;
}
