const MOBILE_BROWSER_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const CHROME_ANDROID_EXCLUDE_RE = /; wv|Version\/\d|OPR|Opera|SamsungBrowser|EdgA|Firefox|FxiOS|DuckDuckGo|UCBrowser|MiuiBrowser|HuaweiBrowser|HeyTapBrowser|VivoBrowser/i;

const CHROME_BACKGROUND_HANDOFF_KEY = "__musicChromeBackgroundHandoff";
export const CHROME_RESUME_SEEK_LEAD_MS = 250;
export const CHROME_HANDOFF_SETTLE_MS = 700;

function getNavigator(navigatorLike) {
  if (navigatorLike) return navigatorLike;
  if (typeof navigator !== "undefined") return navigator;
  return null;
}

export function isMobileBrowser(navigatorLike) {
  const nav = getNavigator(navigatorLike);
  return Boolean(nav?.userAgent && MOBILE_BROWSER_RE.test(nav.userAgent));
}

export function isOfficialChromeAndroid(navigatorLike) {
  const nav = getNavigator(navigatorLike);
  const ua = nav?.userAgent || "";

  if (!/Android/i.test(ua) || !/\bChrome\/\d+/i.test(ua)) return false;
  if (CHROME_ANDROID_EXCLUDE_RE.test(ua)) return false;

  const brands = [
    ...(nav?.userAgentData?.brands || []),
    ...(nav?.userAgentData?.fullVersionList || [])
  ].map((brand) => brand?.brand || "");

  if (brands.some((brand) => /Samsung|Edge|Opera|Brave|Firefox|DuckDuckGo/i.test(brand))) {
    return false;
  }

  return brands.length === 0 || brands.some((brand) => /Google Chrome/i.test(brand));
}

export function shouldUseChromeAndroidBackgroundFallback(settings, navigatorLike) {
  return Boolean(settings?.mobileBackgroundFallback && isOfficialChromeAndroid(navigatorLike));
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeToLoop(ms, loopMs) {
  if (loopMs <= 0) return Math.max(0, ms);
  return ((ms % loopMs) + loopMs) % loopMs;
}

export function estimateLoopAlignedPositionMs({
  anchorPositionMs = 0,
  anchorPreviewSeconds = 0,
  currentPreviewSeconds = 0,
  loopDurationSeconds = 30,
  hiddenAtMs = 0,
  nowMs = Date.now()
} = {}) {
  const loopMs = Math.max(1000, finiteNumber(loopDurationSeconds, 30) * 1000);
  const anchorMs = Math.max(0, finiteNumber(anchorPositionMs, 0));
  const anchorPreviewMs = normalizeToLoop(finiteNumber(anchorPreviewSeconds, 0) * 1000, loopMs);
  const currentPreviewMs = normalizeToLoop(finiteNumber(currentPreviewSeconds, 0) * 1000, loopMs);

  const hiddenAt = finiteNumber(hiddenAtMs, 0);
  const now = finiteNumber(nowMs, 0);

  if (hiddenAt > 0 && now >= hiddenAt) {
    const baseMs = anchorMs + (now - hiddenAt);
    const baseLoopIndex = Math.floor(baseMs / loopMs);
    let best = null;
    let bestDiff = Infinity;

    for (let index = baseLoopIndex - 2; index <= baseLoopIndex + 2; index += 1) {
      const candidate = (index * loopMs) + currentPreviewMs;
      if (candidate < 0) continue;

      const diff = Math.abs(candidate - baseMs);
      if (diff < bestDiff) {
        best = candidate;
        bestDiff = diff;
      }
    }

    if (best !== null) return Math.max(0, best);
  }

  let elapsedMs = currentPreviewMs - anchorPreviewMs;
  if (elapsedMs < 0 && loopMs > 0) elapsedMs += loopMs;
  return Math.max(0, anchorMs + elapsedMs);
}

export function clampPlaybackPositionMs(positionMs, durationMs = 0) {
  const position = Math.max(0, finiteNumber(positionMs, 0));
  const duration = finiteNumber(durationMs, 0);

  if (duration <= 0) return position;
  return Math.min(position, Math.max(0, duration - 1000));
}

export function estimateWallClockPositionMs({
  anchorPositionMs = 0,
  hiddenAtMs = 0,
  nowMs = Date.now(),
  durationMs = 0,
  leadMs = 0
} = {}) {
  const anchor = Math.max(0, finiteNumber(anchorPositionMs, 0));
  const hiddenAt = finiteNumber(hiddenAtMs, 0);
  const now = finiteNumber(nowMs, 0);
  const elapsed = hiddenAt > 0 && now >= hiddenAt ? now - hiddenAt : 0;

  return clampPlaybackPositionMs(anchor + elapsed + finiteNumber(leadMs, 0), durationMs);
}

export function estimateChromeResumePositionMs(session, options = {}) {
  if (!session) return 0;

  const wallClockPosition = estimateWallClockPositionMs({
    anchorPositionMs: session.anchorPositionMs,
    hiddenAtMs: session.hiddenAtMs,
    nowMs: options.nowMs,
    durationMs: session.durationMs,
    leadMs: options.leadMs || 0
  });

  if (!Number.isFinite(options.currentPreviewSeconds)) {
    return wallClockPosition;
  }

  const loopAlignedPosition = estimateLoopAlignedPositionMs({
    anchorPositionMs: session.anchorPositionMs,
    anchorPreviewSeconds: session.anchorPreviewSeconds,
    currentPreviewSeconds: options.currentPreviewSeconds,
    loopDurationSeconds: options.loopDurationSeconds || session.loopDurationSeconds,
    hiddenAtMs: session.hiddenAtMs,
    nowMs: options.nowMs
  });

  // The wall clock is the stable YouTube timeline. The preview loop is only a
  // fallback signal, so never let it pull Chrome back behind elapsed real time.
  return clampPlaybackPositionMs(
    Math.max(wallClockPosition, loopAlignedPosition),
    session.durationMs
  );
}

export function setChromeBackgroundHandoff(session) {
  if (typeof window === "undefined") return null;
  window[CHROME_BACKGROUND_HANDOFF_KEY] = session;
  return session;
}

export function getChromeBackgroundHandoff() {
  if (typeof window === "undefined") return null;
  return window[CHROME_BACKGROUND_HANDOFF_KEY] || null;
}

export function clearChromeBackgroundHandoff(sessionId) {
  if (typeof window === "undefined") return;
  const current = window[CHROME_BACKGROUND_HANDOFF_KEY];
  if (!sessionId || current?.id === sessionId) {
    delete window[CHROME_BACKGROUND_HANDOFF_KEY];
  }
}
