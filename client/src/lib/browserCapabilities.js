const MOBILE_BROWSER_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const CHROME_ANDROID_EXCLUDE_RE = /; wv|Version\/\d|OPR|Opera|SamsungBrowser|EdgA|Firefox|FxiOS|DuckDuckGo|UCBrowser|MiuiBrowser|HuaweiBrowser|HeyTapBrowser|VivoBrowser/i;

export const BACKGROUND_STRATEGIES = Object.freeze({
  NATIVE: "native",
  CHROME_AUDIO_FALLBACK: "chrome-audio-fallback",
  NONE: "none"
});

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

export function supportsMediaSession(navigatorLike) {
  const nav = getNavigator(navigatorLike);
  return Boolean(nav && "mediaSession" in nav);
}

export function supportsWakeLock(navigatorLike) {
  const nav = getNavigator(navigatorLike);
  return Boolean(nav && "wakeLock" in nav);
}

export function shouldUseChromeAndroidBackgroundFallback(settings = {}, navigatorLike) {
  return Boolean(settings?.mobileBackgroundFallback && isOfficialChromeAndroid(navigatorLike));
}

export function getBrowserCapabilities(settings = {}, navigatorLike) {
  const officialChromeAndroid = isOfficialChromeAndroid(navigatorLike);
  const mobileBrowser = isMobileBrowser(navigatorLike);
  const chromeBackgroundFallbackEnabled =
    Boolean(settings?.mobileBackgroundFallback && officialChromeAndroid);

  return {
    isMobileBrowser: mobileBrowser,
    isOfficialChromeAndroid: officialChromeAndroid,
    supportsMediaSession: supportsMediaSession(navigatorLike),
    supportsWakeLock: supportsWakeLock(navigatorLike),
    supportsVisibilityApi: typeof document !== "undefined" && "visibilityState" in document,
    chromeBackgroundFallbackEnabled,
    backgroundStrategy: chromeBackgroundFallbackEnabled
      ? BACKGROUND_STRATEGIES.CHROME_AUDIO_FALLBACK
      : mobileBrowser
        ? BACKGROUND_STRATEGIES.NATIVE
        : BACKGROUND_STRATEGIES.NATIVE
  };
}

export function getBackgroundStrategyLabel(strategy) {
  if (strategy === BACKGROUND_STRATEGIES.CHROME_AUDIO_FALLBACK) return "Chrome fallback";
  if (strategy === BACKGROUND_STRATEGIES.NATIVE) return "Native browser";
  return "None";
}
