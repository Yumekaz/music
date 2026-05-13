import { useRef } from "react";
import { SlidersHorizontal, Tv2, Music2, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useEqualizer } from "../hooks/useEqualizer.js";
import { EQUALIZER_PRESETS } from "../components/equalizer/EqualizerPresets.js";
import { isDirectAudioSource } from "../lib/resolvers.js";

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
  const {
    crossfadeDuration,   setCrossfadeDuration,
    playbackQuality,     setPlaybackQuality,
    equalizerPreset,     equalizerGains, equalizerOpen,
    setBandGain,         setEqualizerPreset, setEqualizerOpen,
  } = useSettingsStore();

  const sourceType = usePlayerStore((state) => state.sourceType);
  const directEnabled = isDirectAudioSource(sourceType);

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
