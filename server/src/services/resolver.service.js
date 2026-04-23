import { findTrackById, resolveFixtureTrack } from "../data/fixtures.js";
import { getOrSetCached } from "../utils/cache.js";
import { normalizeTrack } from "../utils/normalize.js";
import { rankCandidates } from "../utils/ranking.js";
import { getPreviewForTrack } from "./providers/itunes.provider.js";
import { searchJioSaavn } from "./providers/jiosaavn.provider.js";
import { searchJamendo } from "./providers/jamendo.provider.js";
import { searchMusicBrainzRecording } from "./providers/musicbrainz.provider.js";
import { getProviderLinks } from "./providers/odesli.provider.js";
import { searchYouTube } from "./providers/youtube.provider.js";

export async function resolveTrack({ title, artist }) {
  const key = `resolve:${title}:${artist}`;
  return getOrSetCached(key, 60 * 60, async () => {
    const fallback = resolveFixtureTrack(title, artist);

    const [youtubeResult, mbResult, previewResult, jiosaavnResult, jamendoResults] = await Promise.all([
      searchYouTube(`${title} ${artist}`, 5),
      searchMusicBrainzRecording(title, artist),
      getPreviewForTrack(title, artist),
      searchJioSaavn(`${title} ${artist}`),
      searchJamendo(`${title} ${artist}`, 3)
    ]);

    const candidates = [
      fallback,
      ...(youtubeResult || []).map((candidate) => ({
        ...fallback,
        ...candidate,
        title: fallback.title,
        artistName: fallback.artistName
      })),
      mbResult && {
        ...fallback,
        ...mbResult,
        id: fallback.id
      },
      previewResult && {
        ...fallback,
        previewUrl: previewResult.previewUrl || fallback.previewUrl,
        durationMs: previewResult.durationMs || fallback.durationMs
      },
      jiosaavnResult && {
        ...fallback,
        artworkUrl: jiosaavnResult.artworkUrl || fallback.artworkUrl,
        externalLinks: {
          ...fallback.externalLinks,
          ...jiosaavnResult.externalLinks
        }
      },
      jamendoResults?.[0] && {
        ...fallback,
        jamendoId: jamendoResults[0].jamendoId,
        previewUrl: jamendoResults[0].previewUrl || fallback.previewUrl,
        availableProviders: [...new Set([...fallback.availableProviders, "jamendo"])]
      }
    ].filter(Boolean);

    const best = rankCandidates(candidates, {
      title,
      artistName: artist,
      durationMs: fallback.durationMs,
      albumName: fallback.albumName
    })[0];

    const links = await getProviderLinks(best);
    return normalizeTrack(best, {
      externalLinks: links,
      availableProviders: Object.entries(links)
        .filter(([, url]) => Boolean(url))
        .map(([provider]) => provider)
    });
  });
}

export async function getTrackById(id) {
  const fixture = id ? findTrackById(id) : resolveFixtureTrack("", "");
  return fixture ? normalizeTrack(fixture) : null;
}
