import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bug, RotateCcw, Music2, Server, SlidersHorizontal, Tv2 } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useEqualizer } from "../hooks/useEqualizer.js";
import { EQUALIZER_PRESETS } from "../components/equalizer/EqualizerPresets.js";
import { isDirectAudioSource } from "../lib/resolvers.js";
import { getBrowserCapabilities, getBackgroundStrategyLabel } from "../lib/browserCapabilities.js";
import { getChromeBackgroundHandoff } from "../lib/browserPlayback.js";
import { getPlaybackEngineLabel } from "../lib/playbackController.js";
import { getReadinessLabel } from "../lib/queuePreflight.js";
import { getProviderStatus } from "../services/providers.js";

const QUALITY_OPTIONS = [
  { value: "default", label: "Auto",   desc: "YouTube chooses the best quality" },
  { value: "small",   label: "240p",   desc: "Lowest data usage" },
  { value: "medium",  label: "360p",   desc: "Low data usage" },
  { value: "large",   label: "480p",   desc: "Standard" },
  { value: "hd720",   label: "720p",   desc: "HD — recommended" },
  { value: "hd1080",  label: "1080p",  desc: "Full HD" },
  { value: "highres", label: "4K",     desc: "Highest quality" },
];

const BANDS = [
  { label: "60",  frequency: 60 },
  { label: "170", frequency: 170 },
  { label: "310", frequency: 310 },
  { label: "600", frequency: 600 },
  { label: "1k",  frequency: 1000 },
  { label: "3k",  frequency: 3000 },
  { label: "6k",  frequency: 6000 },
  { label: "12k", frequency: 12000 },
];

export default function Settings() {
  const [providerStatus, setProviderStatus] = useState(null);
  const [providerError, setProviderError] = useState("");
  const [chromeHandoff, setChromeHandoff] = useState(null);

  const {
    crossfadeDuration,   setCrossfadeDuration,
    playbackQuality,     setPlaybackQuality,
    equalizerPreset,     equalizerGains, equalizerOpen,
    setBandGain,         setEqualizerPreset, setEqualizerOpen,
    mobileBackgroundFallback, setMobileBackgroundFallback,
  } = useSettingsStore();

  const sourceType = usePlayerStore((state) => state.sourceType);
  const activeEngine = usePlayerStore((state) => state.activeEngine);
  const queueReadiness = usePlayerStore((state) => state.queueReadiness);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const directEnabled = isDirectAudioSource(sourceType);
  const browserCapabilities = useMemo(
    () => getBrowserCapabilities({ mobileBackgroundFallback }),
    [mobileBackgroundFallback]
  );
  const readinessEntries = Object.entries(queueReadiness || {}).slice(0, 4);

  // EQ hook needs an audio ref — pull the singleton element
  const audioRef = useRef(
    typeof Audio !== "undefined"
      ? (document.querySelector("audio") ?? null)
      : null
  );
  useEqualizer(audioRef, directEnabled && equalizerOpen, equalizerGains);

  function resetEQ() {
    setEqualizerPreset("Normal", EQUALIZER_PRESETS["Normal"]);
  }

  useEffect(() => {
    let cancelled = false;
    getProviderStatus()
      .then((status) => {
        if (cancelled) return;
        setProviderStatus(status);
        setProviderError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setProviderError(error?.message || "Provider status unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setChromeHandoff(getChromeBackgroundHandoff());
    const interval = window.setInterval(() => {
      setChromeHandoff(getChromeBackgroundHandoff());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const crossfadeLabel =
    crossfadeDuration === 0 ? "Off" : `${crossfadeDuration}s`;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      {/* ── Playback ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Music2 size={18} aria-hidden="true" />
          <span>Playback</span>
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-label">
              <p>Crossfade</p>
              <span>
                Smooth transition between tracks for iTunes and Jamendo previews.
                Set to 0 to disable.
              </span>
            </div>
            <div className="settings-row-control crossfade-control">
              <span className="crossfade-value">{crossfadeLabel}</span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                aria-label="Crossfade duration in seconds"
                className="settings-slider"
                style={{ "--progress": `${(crossfadeDuration / 12) * 100}%` }}
              />
              <div className="crossfade-ticks">
                <span>Off</span>
                <span>6s</span>
                <span>12s</span>
              </div>
            </div>
          </div>

          <div className="settings-row settings-row--compact" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
            <div className="settings-row-label">
              <p>Mobile Background Playback</p>
              <span>
                Uses audio previews only on Chrome Android when the browser is minimized.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={mobileBackgroundFallback}
              className={`toggle-switch ${mobileBackgroundFallback ? "on" : ""}`}
              onClick={() => setMobileBackgroundFallback(!mobileBackgroundFallback)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </section>

      {/* Diagnostics */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Bug size={18} aria-hidden="true" />
          <span>Diagnostics</span>
        </div>

        <div className="settings-card diagnostics-card">
          <div className="diagnostics-grid">
            <div>
              <span>Browser</span>
              <strong>{browserCapabilities.isOfficialChromeAndroid ? "Chrome Android" : browserCapabilities.isMobileBrowser ? "Mobile browser" : "Desktop browser"}</strong>
            </div>
            <div>
              <span>Background</span>
              <strong>{getBackgroundStrategyLabel(browserCapabilities.backgroundStrategy)}</strong>
            </div>
            <div>
              <span>Engine</span>
              <strong>{getPlaybackEngineLabel(activeEngine)}</strong>
            </div>
            <div>
              <span>Source</span>
              <strong>{sourceType}</strong>
            </div>
            <div>
              <span>Media Session</span>
              <strong>{browserCapabilities.supportsMediaSession ? "Supported" : "Unavailable"}</strong>
            </div>
            <div>
              <span>Wake Lock</span>
              <strong>{browserCapabilities.supportsWakeLock ? "Supported" : "Unavailable"}</strong>
            </div>
            <div>
              <span>Current Track</span>
              <strong>{currentTrack?.title || "None"}</strong>
            </div>
            <div>
              <span>Chrome Handoff</span>
              <strong>{chromeHandoff ? "Active" : "Idle"}</strong>
            </div>
          </div>

          <div className="diagnostics-block">
            <div className="diagnostics-block-title">
              <Activity size={15} aria-hidden="true" />
              <span>Queue Readiness</span>
            </div>
            {readinessEntries.length ? (
              <div className="diagnostics-list">
                {readinessEntries.map(([trackId, readiness]) => (
                  <div key={trackId} className="diagnostics-row">
                    <span>{trackId}</span>
                    <strong>{getReadinessLabel(readiness.status)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="settings-card-note">No queue checks yet.</p>
            )}
          </div>

          <div className="diagnostics-block">
            <div className="diagnostics-block-title">
              <Server size={15} aria-hidden="true" />
              <span>Provider Health</span>
            </div>
            {providerError ? (
              <p className="settings-card-note">{providerError}</p>
            ) : providerStatus?.providers ? (
              <div className="diagnostics-list">
                {Object.entries(providerStatus.providers).map(([name, provider]) => (
                  <div key={name} className="diagnostics-row">
                    <span>{name}</span>
                    <strong>{provider.status} / {provider.mode}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="settings-card-note">Checking providers...</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Video Quality ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <Tv2 size={18} aria-hidden="true" />
          <span>Video Quality</span>
        </div>

        <div className="settings-card">
          <p className="settings-card-note">
            Applies to YouTube playback. YouTube may override this based on
            connection speed and video availability.
          </p>
          <div className="quality-grid">
            {QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`quality-tile ${playbackQuality === opt.value ? "active" : ""}`}
                onClick={() => setPlaybackQuality(opt.value)}
              >
                <span className="quality-tile-label">{opt.label}</span>
                <span className="quality-tile-desc">{opt.desc}</span>
                {playbackQuality === opt.value && (
                  <span className="quality-tile-check" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Equalizer ── */}
      <section className="settings-section">
        <div className="settings-section-title">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>Equalizer</span>
        </div>

        <div className="settings-card">
          <p className="settings-card-note">
            Only applies to iTunes 30s previews and Jamendo tracks — not YouTube.
            Enable EQ, then pick a preset or drag the bands.
          </p>

          {/* Enable toggle */}
          <div className="settings-row settings-row--compact">
            <div className="settings-row-label">
              <p>Enable Equalizer</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={equalizerOpen}
              className={`toggle-switch ${equalizerOpen ? "on" : ""}`}
              onClick={() => setEqualizerOpen(!equalizerOpen)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {equalizerOpen && (
            <>
              {/* Presets */}
              <div className="eq-preset-row">
                {Object.keys(EQUALIZER_PRESETS).filter((p) => p !== "Custom").map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`eq-preset-chip ${equalizerPreset === name ? "active" : ""}`}
                    onClick={() => setEqualizerPreset(name, EQUALIZER_PRESETS[name])}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  className="eq-preset-chip eq-reset"
                  onClick={resetEQ}
                  title="Reset to Normal"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Band sliders */}
              <div className="eq-bands-full">
                {BANDS.map((band, index) => {
                  const gain = equalizerGains[index] ?? 0;
                  const pct = ((gain + 12) / 24) * 100;
                  return (
                    <div key={band.frequency} className="eq-band-col">
                      <span className="eq-band-gain">
                        {gain > 0 ? `+${gain}` : gain}
                      </span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        disabled={!directEnabled}
                        onChange={(e) => setBandGain(index, Number(e.target.value))}
                        aria-label={`${band.label} Hz gain`}
                        className="eq-band-slider"
                        style={{ "--progress": `${pct}%` }}
                        orient="vertical"
                      />
                      <span className="eq-band-label">{band.label}</span>
                    </div>
                  );
                })}
              </div>

              {!directEnabled && (
                <p className="settings-card-note" style={{ marginTop: "12px" }}>
                  Play an iTunes or Jamendo preview to activate EQ.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
