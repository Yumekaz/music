import { getDownload } from "./idb.js";
import { useSettingsStore } from "../store/settingsStore.js";

let directAudioElement = null;
let fadeTimer = null;

// Web Audio API singleton state
let audioCtx = null;
let audioSource = null;
let biquadFilters = [];
let analyserNode = null;
let isAudioGraphSetup = false;

export const BANDS = [
  { label: "60", frequency: 60, type: "lowshelf" },
  { label: "170", frequency: 170, type: "peaking" },
  { label: "310", frequency: 310, type: "peaking" },
  { label: "600", frequency: 600, type: "peaking" },
  { label: "1k", frequency: 1000, type: "peaking" },
  { label: "3k", frequency: 3000, type: "peaking" },
  { label: "6k", frequency: 6000, type: "peaking" },
  { label: "12k", frequency: 12000, type: "highshelf" }
];

export function getDirectAudioElement() {
  if (typeof Audio === "undefined") return null;

  if (!directAudioElement) {
    directAudioElement = new Audio();
    directAudioElement.preload = "metadata";
    directAudioElement.crossOrigin = "anonymous"; // Needed for Web Audio API visualizer
  }

  return directAudioElement;
}

export function getAudioContext() {
  if (typeof window === "undefined" || !window.AudioContext) return null;

  // Detect if mobile browser
  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) return null;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function getAnalyserNode() {
  setupAudioGraph();
  return analyserNode;
}

export function getBiquadFilters() {
  setupAudioGraph();
  return biquadFilters;
}

export function setupAudioGraph() {
  if (isAudioGraphSetup) return;

  // Detect if mobile browser
  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    console.log("[directAudio] Mobile browser detected; bypassing AudioContext graph for background playback support.");
    return;
  }

  const audio = getDirectAudioElement();
  const ctx = getAudioContext();
  if (!audio || !ctx) return;

  try {
    audioSource = ctx.createMediaElementSource(audio);
    
    // Create AnalyserNode
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;

    // Create Equalizer Filters
    biquadFilters = BANDS.map((band) => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    // Chain: Source -> Analyser -> EQ Filters -> Destination
    audioSource.connect(analyserNode);

    let currentConnector = analyserNode;
    biquadFilters.forEach((filter) => {
      currentConnector.connect(filter);
      currentConnector = filter;
    });

    currentConnector.connect(ctx.destination);
    isAudioGraphSetup = true;
  } catch (err) {
    console.error("Failed to setup Web Audio API graph:", err);
  }
}

// Keep a map of trackId -> objectURL to clean up correctly
const activeObjectURLs = new Map();

// Cache for resolved direct audio URLs (e.g. object URLs or streaming URLs)
const resolvedSourceCache = new Map();

// Prefetch next track URL asynchronously in the background so it's ready synchronously
export async function prefetchDirectAudioSource(track, sourceType) {
  if (!track || resolvedSourceCache.has(track.id)) return;
  const src = await getDirectAudioSource(track, sourceType);
  if (src) {
    resolvedSourceCache.set(track.id, src);
  }
}

// Synchronous version to get source URL if cached, falling back to network URL
export function getDirectAudioSourceSync(track, sourceType) {
  if (!track) return "";
  if (resolvedSourceCache.has(track.id)) {
    return resolvedSourceCache.get(track.id);
  }
  return sourceType === "jamendo" ? track.jamendoUrl || track.previewUrl || "" : track.previewUrl || "";
}

export async function getDirectAudioSource(track, sourceType) {
  if (!track) return "";
  if (resolvedSourceCache.has(track.id)) {
    return resolvedSourceCache.get(track.id);
  }

  try {
    const downloaded = await getDownload(track.id);
    if (downloaded && downloaded.blob) {
      if (activeObjectURLs.has(track.id)) {
        URL.revokeObjectURL(activeObjectURLs.get(track.id));
      }
      const objectURL = URL.createObjectURL(downloaded.blob);
      activeObjectURLs.set(track.id, objectURL);
      resolvedSourceCache.set(track.id, objectURL);
      return objectURL;
    }
  } catch (err) {
    console.error("Failed to load downloaded track, falling back to remote source", err);
  }

  const src = sourceType === "jamendo" ? track.jamendoUrl || track.previewUrl || "" : track.previewUrl || "";
  resolvedSourceCache.set(track.id, src);
  return src;
}

export function loadDirectAudioSync(track, sourceType) {
  const audio = getDirectAudioElement();
  const src = getDirectAudioSourceSync(track, sourceType);
  if (!audio || !src) return null;

  setupAudioGraph();

  if (audio.src !== src) {
    audio.src = src;
    audio.load();
  }

  return audio;
}

export async function loadDirectAudio(track, sourceType) {
  const audio = getDirectAudioElement();
  const src = await getDirectAudioSource(track, sourceType);
  if (!audio || !src) return null;

  setupAudioGraph();

  if (audio.src !== src) {
    audio.src = src;
    audio.load();
  }

  return audio;
}

export function playDirectAudioSync(track, sourceType) {
  const audio = loadDirectAudioSync(track, sourceType);
  if (!audio) return false;

  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  audio.play().catch(() => {});
  return true;
}

export async function playDirectAudio(track, sourceType) {
  const audio = await loadDirectAudio(track, sourceType);
  if (!audio) return false;

  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  await audio.play();
  return true;
}

export function pauseDirectAudio() {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
  const audio = getDirectAudioElement();
  audio?.pause();
}

/**
 * Smooth transition to a new track using crossfade:
 * fade out current → swap source → fade in.
 */
export async function fadeOutAndSwap(track, sourceType, durationSecs, targetVolume) {
  const audio = getDirectAudioElement();
  if (!audio) return;

  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }

  const src = await getDirectAudioSource(track, sourceType);
  if (!src) return;

  setupAudioGraph();

  // Hard cut if crossfade is disabled or audio isn't playing
  if (durationSecs <= 0 || audio.paused) {
    if (typeof targetVolume === "number") {
      audio.volume = targetVolume;
    }
    audio.src = src;
    audio.load();
    audio.play().catch(() => {});
    return;
  }

  const startVol = typeof targetVolume === "number" ? targetVolume : audio.volume;
  const STEPS = 20;
  const stepMs = (durationSecs * 500) / STEPS; // half duration for fade out
  let step = 0;

  fadeTimer = setInterval(() => {
    step++;
    audio.volume = Math.max(0, startVol * (1 - step / STEPS));

    if (step >= STEPS) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      audio.pause();

      audio.src = src;
      audio.volume = 0;
      audio.load();
      audio.play().catch(() => {});

      let inStep = 0;
      fadeTimer = setInterval(() => {
        inStep++;
        audio.volume = Math.min(startVol, startVol * (inStep / STEPS));
        if (inStep >= STEPS) {
          clearInterval(fadeTimer);
          fadeTimer = null;
          audio.volume = startVol;
        }
      }, stepMs);
    }
  }, stepMs);
}

let silenceWavUrl = null;

export function getSilenceWavUrl() {
  if (silenceWavUrl) return silenceWavUrl;

  try {
    const sampleRate = 8000; // Lower sample rate for smaller size
    const numSamples = sampleRate; // 1 second
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, 1, true);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    silenceWavUrl = URL.createObjectURL(blob);
    return silenceWavUrl;
  } catch (err) {
    console.error("Failed to generate silence WAV", err);
    return "";
  }
}

export function syncAudioStateSync(track, sourceType, isPlaying, volume, options = {}) {
  if (typeof Audio === "undefined") return;
  const audio = getDirectAudioElement();
  if (!audio) return;

  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isDirect = sourceType === "preview" || sourceType === "jamendo";

  if (isDirect) {
    audio.loop = Boolean(track?.videoId);
    if (isPlaying) {
      if (track) {
        const src = getDirectAudioSourceSync(track, sourceType);
        if (audio.src !== src) {
          const crossfadeDuration = options.crossfadeDuration || 0;
          const wasYouTube = options.wasYouTube || false;
          if (crossfadeDuration > 0 && !wasYouTube && !audio.paused) {
            fadeOutAndSwap(track, sourceType, crossfadeDuration, volume);
          } else {
            setupAudioGraph();
            audio.src = src;
            audio.load();
            audio.volume = volume;
            audio.play().catch(() => {});
          }
        } else {
          audio.volume = volume;
          if (audio.paused) {
            audio.play().catch(() => {});
          }
        }
      }
    } else {
      audio.pause();
    }
  } else {
    // YouTube / silence loop
    if (isPlaying) {
      const hasPreview = isMobile && track && (track.previewUrl || track.jamendoUrl);
      const targetSrc = hasPreview 
        ? getDirectAudioSourceSync(track, "preview")
        : getSilenceWavUrl();

      // Dynamic Fallback Volume: play fallback preview at user volume when hidden, else keep-alive silent
      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const settings = useSettingsStore.getState();
      const targetVolume = (isMobile && isHidden && settings?.mobileBackgroundFallback && hasPreview)
        ? volume
        : 0.001;

      if (audio.src !== targetSrc) {
        setupAudioGraph();
        audio.src = targetSrc;
        audio.loop = true;
        audio.volume = targetVolume;
        audio.load();
      } else {
        audio.volume = targetVolume;
        audio.loop = true;
      }
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }
}

