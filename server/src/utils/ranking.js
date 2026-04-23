import { normalizeTerm } from "../data/fixtures.js";

function durationScore(candidateDuration, targetDuration) {
  if (!candidateDuration || !targetDuration) return 0;
  const deltaSeconds = Math.abs(candidateDuration - targetDuration) / 1000;
  if (deltaSeconds <= 5) return 20;
  if (deltaSeconds <= 15) return 10;
  return 0;
}

export function scoreCandidate(candidate, target = {}) {
  const title = normalizeTerm(candidate.title);
  const artist = normalizeTerm(candidate.artistName || candidate.channelTitle || "");
  const targetTitle = normalizeTerm(target.title);
  const targetArtist = normalizeTerm(target.artistName || target.artist || "");

  let score = 0;

  if (candidate.mbid) score += 35;
  if (title === targetTitle) score += 30;
  if (title.includes(targetTitle) || targetTitle.includes(title)) score += 12;
  if (targetArtist && artist.includes(targetArtist)) score += 24;
  if (candidate.albumName && target.albumName && normalizeTerm(candidate.albumName) === normalizeTerm(target.albumName)) {
    score += 12;
  }
  score += durationScore(candidate.durationMs, target.durationMs);
  if (candidate.previewUrl) score += 8;
  if (candidate.videoId) score += 8;
  score += Math.min(Number(candidate.popularity || candidate.viewCount || 0) / 10, 10);

  return score;
}

export function rankCandidates(candidates, target) {
  return [...candidates]
    .filter(Boolean)
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, target)
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => candidate);
}
