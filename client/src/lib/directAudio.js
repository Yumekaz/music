import { getDownload } from "./idb.js";

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

export async function getDirectAudioSource(track, sourceType) {
  if (!track) return "";

  try {
    const downloaded = await getDownload(track.id);
    if (downloaded && downloaded.blob) {
      if (activeObjectURLs.has(track.id)) {
        URL.revokeObjectURL(activeObjectURLs.get(track.id));
      }
      const objectURL = URL.createObjectURL(downloaded.blob);
      activeObjectURLs.set(track.id, objectURL);
      return objectURL;
    }
  } catch (err) {
    console.error("Failed to load downloaded track, falling back to remote source", err);
  }

  return sourceType === "jamendo" ? track.jamendoUrl || track.previewUrl || "" : track.previewUrl || "";
}

export async function loadDirectAudio(track, sourceType) {
  const audio = getDirectAudioElement();
  const src = await getDirectAudioSource(track, sourceType);
  if (!audio || !src) return null;

  // Make sure graph is instantiated
  setupAudioGraph();

  if (audio.src !== src) {
    audio.src = src;
    audio.load();
  }

  return audio;
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
